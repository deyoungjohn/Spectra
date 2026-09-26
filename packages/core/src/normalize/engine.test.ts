// packages/core/src/normalize/engine.test.ts
import { describe, it, expect, vi } from "vitest";
import { NormalizationEngine, type RatioDriftEvent } from "./engine.js";
import {
  MockRwaDataProvider,
  DataIngestionService,
  type RawRwaToken,
} from "../services/data-ingestion.js";
import type { ITradFiClient } from "../services/tradfi.js";
import { parseToFixed18, toPerShare } from "./fixed-point.js";

describe("NormalizationEngine", () => {
  it("normalizes token price to per-share using live tokenToShareRatio", async () => {
    const provider = new MockRwaDataProvider();
    const ingestion = new DataIngestionService(provider);
    const mockTradFi: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue({
        ticker: "AAPL",
        price: parseToFixed18("333.90"),
        timestamp: new Date(),
        source: "mock",
      }),
    };

    const engine = new NormalizationEngine(ingestion, mockTradFi);
    const stock = await engine.getByTicker("AAPL", "ONDO");

    expect(stock).not.toBeNull();
    // Verify perSharePrice is toPerShare(tokenPrice, tokenToShareRatio)
    const expectedPerShare = toPerShare(stock!.tokenPrice, stock!.tokenToShareRatio);
    expect(stock!.perSharePrice).toBe(expectedPerShare);
    expect(stock!.tradfiPrice).toBe(parseToFixed18("333.90"));
  });

  it("calculates oracle divergence in basis points during OPEN market", async () => {
    const rawToken: RawRwaToken = {
      ticker: "AAPL",
      platform: "ONDO",
      tokenAddress: "0x123",
      tokenPrice: parseToFixed18("101.0"),
      tokenToShareRatio: parseToFixed18("1.0"),
      marketStatus: "OPEN",
      nextOpenTime: null,
      dexLiquidityUsd: 1000n,
      slippageBps: 10n,
      lastUpdated: new Date(),
    };

    const provider = new MockRwaDataProvider([rawToken]);
    const ingestion = new DataIngestionService(provider);
    const mockTradFi: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue({
        ticker: "AAPL",
        price: parseToFixed18("100.0"), // TradFi is 100, onchain per-share is 101 -> +100 bps
        timestamp: new Date(),
        source: "mock",
      }),
    };

    const engine = new NormalizationEngine(ingestion, mockTradFi);
    const normalized = await engine.getByTicker("AAPL");

    expect(normalized).not.toBeNull();
    expect(normalized!.oracleDivergenceBps).toBe(100n);
    expect(normalized!.weekendPremiumBps).toBe(0n);
  });

  it("calculates weekend premium in basis points during CLOSED market", async () => {
    const rawToken: RawRwaToken = {
      ticker: "AAPL",
      platform: "ONDO",
      tokenAddress: "0x123",
      tokenPrice: parseToFixed18("102.0"),
      tokenToShareRatio: parseToFixed18("1.0"),
      marketStatus: "CLOSED",
      nextOpenTime: new Date(),
      dexLiquidityUsd: 1000n,
      slippageBps: 10n,
      lastUpdated: new Date(),
    };

    const provider = new MockRwaDataProvider([rawToken]);
    const ingestion = new DataIngestionService(provider);
    const mockTradFi: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue({
        ticker: "AAPL",
        price: parseToFixed18("100.0"),
        timestamp: new Date(),
        source: "mock",
      }),
    };

    const engine = new NormalizationEngine(ingestion, mockTradFi);
    const normalized = await engine.getByTicker("AAPL");

    expect(normalized).not.toBeNull();
    expect(normalized!.oracleDivergenceBps).toBe(0n);
    expect(normalized!.weekendPremiumBps).toBe(200n); // +200 bps
  });

  it("calculates cross-platform basis when ticker exists on multiple platforms", async () => {
    const rawTokens: RawRwaToken[] = [
      {
        ticker: "AAPL",
        platform: "ONDO",
        tokenAddress: "0x123",
        tokenPrice: parseToFixed18("101.0"),
        tokenToShareRatio: parseToFixed18("1.0"),
        marketStatus: "OPEN",
        nextOpenTime: null,
        dexLiquidityUsd: 1000n,
        slippageBps: 10n,
        lastUpdated: new Date(),
      },
      {
        ticker: "AAPL",
        platform: "BSTOCKS",
        tokenAddress: "0x456",
        tokenPrice: parseToFixed18("100.0"),
        tokenToShareRatio: parseToFixed18("1.0"),
        marketStatus: "OPEN",
        nextOpenTime: null,
        dexLiquidityUsd: 1000n,
        slippageBps: 10n,
        lastUpdated: new Date(),
      },
    ];

    const provider = new MockRwaDataProvider(rawTokens);
    const ingestion = new DataIngestionService(provider);
    const mockTradFi: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(null),
    };

    const engine = new NormalizationEngine(ingestion, mockTradFi);
    const all = await engine.getAll();

    const ondoAapl = all.find((s) => s.platform === "ONDO");
    const bstocksAapl = all.find((s) => s.platform === "BSTOCKS");

    // Both should report the cross-platform basis: (101 - 100) / 100 = 100 bps
    expect(ondoAapl?.crossPlatformBasisBps).toBe(100n);
    expect(bstocksAapl?.crossPlatformBasisBps).toBe(100n);
  });

  it("fires ratio drift event when tokenToShareRatio changes (§5.3 Signal F, §5.10)", async () => {
    const tokenV1: RawRwaToken = {
      ticker: "AAPL",
      platform: "ONDO",
      tokenAddress: "0x123",
      tokenPrice: parseToFixed18("100.0"),
      tokenToShareRatio: parseToFixed18("1.000"),
      marketStatus: "OPEN",
      nextOpenTime: null,
      dexLiquidityUsd: 1000n,
      slippageBps: 10n,
      lastUpdated: new Date(),
    };

    const provider = new MockRwaDataProvider([tokenV1]);
    const ingestion = new DataIngestionService(provider);
    const mockTradFi: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(null),
    };

    const engine = new NormalizationEngine(ingestion, mockTradFi);

    const driftEvents: RatioDriftEvent[] = [];
    engine.onRatioDrift((e) => driftEvents.push(e));

    // First normalization pass sets baseline
    await engine.getAll();
    expect(driftEvents).toHaveLength(0);

    // Simulate dividend or split: ratio jumps to 1.005
    const tokenV2: RawRwaToken = {
      ...tokenV1,
      tokenToShareRatio: parseToFixed18("1.005"),
    };
    provider.setTokens([tokenV2]);

    // Second pass should detect drift
    await engine.getAll();
    expect(driftEvents).toHaveLength(1);
    expect(driftEvents[0]!.ticker).toBe("AAPL");
    expect(driftEvents[0]!.platform).toBe("ONDO");
    expect(driftEvents[0]!.oldRatio).toBe(parseToFixed18("1.000"));
    expect(driftEvents[0]!.newRatio).toBe(parseToFixed18("1.005"));
  });

  it("handles missing TradFi feed gracefully (§5.10)", async () => {
    const provider = new MockRwaDataProvider();
    const ingestion = new DataIngestionService(provider);
    // TradFi feed down returns null
    const mockTradFi: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue(null),
    };

    const engine = new NormalizationEngine(ingestion, mockTradFi);
    const stock = await engine.getByTicker("AAPL");

    expect(stock).not.toBeNull();
    expect(stock!.tradfiPrice).toBe(0n);
    expect(stock!.oracleDivergenceBps).toBe(0n); // Suspended
    expect(stock!.weekendPremiumBps).toBe(0n);
  });
});
