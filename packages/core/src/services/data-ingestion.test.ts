// packages/core/src/services/data-ingestion.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  MockRwaDataProvider,
  BinanceRwaDataProvider,
  DataIngestionService,
  type IRwaDataProvider,
} from "./data-ingestion.js";
import { MemoryCacheService } from "./cache.js";
import { parseToFixed18 } from "../normalize/fixed-point.js";

describe("MockRwaDataProvider", () => {
  it("provides initial tokenized stocks including AAPL benchmark", async () => {
    const provider = new MockRwaDataProvider();
    const tokens = await provider.fetchTokens();

    expect(tokens.length).toBeGreaterThan(0);
    const aaplOndo = tokens.find((t) => t.ticker === "AAPL" && t.platform === "ONDO");
    expect(aaplOndo).toBeDefined();
    expect(aaplOndo?.tokenPrice).toBe(parseToFixed18("335.02"));
    expect(aaplOndo?.tokenToShareRatio).toBe(parseToFixed18("1.003376073740221058"));
  });
});

describe("BinanceRwaDataProvider", () => {
  it("fetches and maps token list from API format", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            symbol: "AAPL",
            platform: "ONDO",
            tokenAddress: "0x123",
            tokenPrice: "220.50",
            tokenToShareRatio: "1.002",
            marketStatus: "OPEN",
            dexLiquidityUsd: "100000",
            slippageBps: 12,
            sector: "Magnificent 7",
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const provider = new BinanceRwaDataProvider({
      baseUrl: "https://test.api",
      apiKey: "test_key",
      fetchFn: mockFetch,
    });

    const tokens = await provider.fetchTokens();
    expect(tokens).toHaveLength(1);
    expect(tokens[0]!.ticker).toBe("AAPL");
    expect(tokens[0]!.platform).toBe("ONDO");
    expect(tokens[0]!.tokenPrice).toBe(parseToFixed18("220.50"));
    expect(tokens[0]!.tokenToShareRatio).toBe(parseToFixed18("1.002"));
  });

  it("throws on HTTP error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    const provider = new BinanceRwaDataProvider({ fetchFn: mockFetch });
    await expect(provider.fetchTokens()).rejects.toThrow("RWA API error");
  });
});

describe("DataIngestionService", () => {
  it("fetches and caches tokens", async () => {
    const cache = new MemoryCacheService();
    const provider = new MockRwaDataProvider();
    const fetchSpy = vi.spyOn(provider, "fetchTokens");

    const service = new DataIngestionService(provider, { cache, cacheTtlSeconds: 60 });
    const list1 = await service.getStockList();
    const list2 = await service.getStockList();

    expect(list1.length).toBeGreaterThan(0);
    expect(list2.length).toBe(list1.length);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Cached on second call
  });

  it("finds specific token by ticker and platform", async () => {
    const provider = new MockRwaDataProvider();
    const service = new DataIngestionService(provider);

    const aaplOndo = await service.getStock("AAPL", "ONDO");
    expect(aaplOndo).toBeDefined();
    expect(aaplOndo?.platform).toBe("ONDO");

    const aaplBstocks = await service.getStock("AAPL", "BSTOCKS");
    expect(aaplBstocks).toBeDefined();
    expect(aaplBstocks?.platform).toBe("BSTOCKS");

    const nonExistent = await service.getStock("XYZ");
    expect(nonExistent).toBeNull();
  });

  it("computes overall market status", async () => {
    const provider = new MockRwaDataProvider();
    const service = new DataIngestionService(provider);

    const status = await service.getMarketStatus();
    expect(status.isOpen).toBe(true);
    expect(status.status).toBe("OPEN");
  });

  it("serves stale cache with isStale flag when provider fails (§5.10)", async () => {
    let fail = false;
    const provider: IRwaDataProvider = {
      fetchTokens: vi.fn().mockImplementation(async () => {
        if (fail) throw new Error("API Down");
        return [
          {
            ticker: "AAPL",
            platform: "ONDO",
            tokenAddress: "0x123",
            tokenPrice: parseToFixed18("300.0"),
            tokenToShareRatio: parseToFixed18("1.0"),
            marketStatus: "OPEN",
            nextOpenTime: null,
            dexLiquidityUsd: 1000n,
            slippageBps: 10n,
            lastUpdated: new Date(),
          },
        ];
      }),
    };

    const service = new DataIngestionService(provider);
    const initialList = await service.getStockList();
    expect(initialList[0]!.isStale).toBeFalsy();
    expect(service.getIsAvailable()).toBe(true);

    // Simulate failure
    fail = true;
    const fallbackList = await service.getStockList();
    expect(fallbackList[0]!.isStale).toBe(true);
    expect(service.getIsAvailable()).toBe(false);
  });
});
