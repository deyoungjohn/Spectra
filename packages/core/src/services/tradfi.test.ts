// packages/core/src/services/tradfi.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  FinnhubClient,
  YFinanceClient,
  CompositeTradFiClient,
  type ITradFiClient,
  type TradFiQuote,
} from "./tradfi.js";
import { MemoryCacheService } from "./cache.js";
import { parseToFixed18 } from "../normalize/fixed-point.js";

describe("FinnhubClient", () => {
  it("returns null if API key is empty", async () => {
    const client = new FinnhubClient("");
    const quote = await client.getQuote("AAPL");
    expect(quote).toBeNull();
  });

  it("fetches and parses real-time quote", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ c: 224.5, t: 1700000000 }),
    }) as unknown as typeof fetch;

    const client = new FinnhubClient("test_key", mockFetch);
    const quote = await client.getQuote("AAPL");

    expect(quote).not.toBeNull();
    expect(quote?.ticker).toBe("AAPL");
    expect(quote?.price).toBe(parseToFixed18("224.5"));
    expect(quote?.source).toBe("finnhub");
  });

  it("returns null on HTTP error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    }) as unknown as typeof fetch;

    const client = new FinnhubClient("bad_key", mockFetch);
    const quote = await client.getQuote("AAPL");
    expect(quote).toBeNull();
  });
});

describe("YFinanceClient", () => {
  it("fetches and parses yfinance chart response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        chart: {
          result: [
            {
              meta: {
                regularMarketPrice: 224.55,
                regularMarketTime: 1700000000,
              },
            },
          ],
        },
      }),
    }) as unknown as typeof fetch;

    const client = new YFinanceClient(mockFetch);
    const quote = await client.getQuote("AAPL");

    expect(quote).not.toBeNull();
    expect(quote?.ticker).toBe("AAPL");
    expect(quote?.price).toBe(parseToFixed18("224.55"));
    expect(quote?.source).toBe("yfinance");
  });

  it("returns null if price missing in response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ chart: { result: [{ meta: {} }] } }),
    }) as unknown as typeof fetch;

    const client = new YFinanceClient(mockFetch);
    const quote = await client.getQuote("AAPL");
    expect(quote).toBeNull();
  });
});

describe("CompositeTradFiClient", () => {
  it("uses primary client when successful", async () => {
    const primaryQuote: TradFiQuote = {
      ticker: "AAPL",
      price: parseToFixed18("224.5"),
      timestamp: new Date(),
      source: "finnhub",
    };
    const primary: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(primaryQuote),
    };
    const fallback: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(null),
    };

    const composite = new CompositeTradFiClient(primary, fallback);
    const quote = await composite.getQuote("AAPL");

    expect(quote).toEqual(primaryQuote);
    expect(primary.getQuote).toHaveBeenCalledWith("AAPL");
    expect(fallback.getQuote).not.toHaveBeenCalled();
  });

  it("falls back to secondary client when primary fails", async () => {
    const fallbackQuote: TradFiQuote = {
      ticker: "AAPL",
      price: parseToFixed18("224.4"),
      timestamp: new Date(),
      source: "yfinance",
    };
    const primary: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(null),
    };
    const fallback: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(fallbackQuote),
    };

    const composite = new CompositeTradFiClient(primary, fallback);
    const quote = await composite.getQuote("AAPL");

    expect(quote).toEqual(fallbackQuote);
    expect(primary.getQuote).toHaveBeenCalledWith("AAPL");
    expect(fallback.getQuote).toHaveBeenCalledWith("AAPL");
  });

  it("uses cache to avoid redundant calls", async () => {
    const cache = new MemoryCacheService();
    const primaryQuote: TradFiQuote = {
      ticker: "AAPL",
      price: parseToFixed18("224.5"),
      timestamp: new Date(),
      source: "finnhub",
    };
    const primary: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(primaryQuote),
    };
    const fallback: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(null),
    };

    const composite = new CompositeTradFiClient(primary, fallback, { cache });
    await composite.getQuote("AAPL");
    await composite.getQuote("AAPL");

    expect(primary.getQuote).toHaveBeenCalledTimes(1);
  });

  it("returns last known quote marked stale when both feeds fail (§5.10)", async () => {
    const initialQuote: TradFiQuote = {
      ticker: "AAPL",
      price: parseToFixed18("224.5"),
      timestamp: new Date(),
      source: "finnhub",
    };
    let shouldFail = false;

    const primary: ITradFiClient = {
      getQuote: vi.fn().mockImplementation(async () => (shouldFail ? null : initialQuote)),
    };
    const fallback: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(null),
    };

    const composite = new CompositeTradFiClient(primary, fallback);
    const q1 = await composite.getQuote("AAPL");
    expect(q1?.isStale).toBeFalsy();

    // Now simulate outage of both feeds
    shouldFail = true;
    const q2 = await composite.getQuote("AAPL");
    expect(q2).not.toBeNull();
    expect(q2?.isStale).toBe(true);
    expect(q2?.price).toBe(initialQuote.price);
  });
});
