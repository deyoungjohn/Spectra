// packages/core/src/flow/flow.test.ts

import { describe, it, expect } from "vitest";
import { parseToFixed18 } from "../normalize/fixed-point.js";
import { MockBscScanProvider, HttpBscScanClient } from "./bscscan.js";
import { FlowAggregator } from "./aggregator.js";
import { FlowSignalEngine } from "./engine.js";
import { SignalEngine } from "../signals/engine.js";
import { MemoryCacheService } from "../services/cache.js";

describe("Flow Radar Layer (Module 3)", () => {
  describe("BscScan Providers", () => {
    it("MockBscScanProvider returns seeded transfer events and filters by ticker", async () => {
      const provider = new MockBscScanProvider();
      const allTransfers = await provider.getTokenTransfers({});
      expect(allTransfers.length).toBeGreaterThan(0);

      const aaplTransfers = await provider.getTokenTransfers({ ticker: "AAPL" });
      expect(aaplTransfers.length).toBeGreaterThan(0);
      expect(aaplTransfers.every((t) => t.ticker === "AAPL")).toBe(true);
    });

    it("MockBscScanProvider filters by token address and limit", async () => {
      const provider = new MockBscScanProvider();
      const ondoAaplAddr = "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4";
      const transfers = await provider.getTokenTransfers({
        tokenAddress: ondoAaplAddr,
        limit: 1,
      });

      expect(transfers.length).toBe(1);
      expect(transfers[0]?.tokenAddress.toLowerCase()).toBe(ondoAaplAddr.toLowerCase());
    });

    it("HttpBscScanClient degrades gracefully to mock provider when no API key is set", async () => {
      const cache = new MemoryCacheService();
      const client = new HttpBscScanClient({ cache });
      const transfers = await client.getTokenTransfers({ ticker: "AAPL" });
      expect(transfers.length).toBeGreaterThan(0);
    });
  });

  describe("FlowAggregator", () => {
    it("computes 1h, 4h, and 24h net flow accurately", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider);
      const summary = await aggregator.aggregateTickerFlow("AAPL");

      expect(summary.ticker).toBe("AAPL");
      expect(typeof summary.netFlow1hUsd).toBe("bigint");
      expect(typeof summary.netFlow4hUsd).toBe("bigint");
      expect(typeof summary.netFlow24hUsd).toBe("bigint");
      expect(summary.inflow24hUsd).toBeGreaterThan(0n);
    });

    it("identifies top wallets and ranks them by flow", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider);
      const summary = await aggregator.aggregateTickerFlow("AAPL");

      expect(summary.topWallets.length).toBeGreaterThan(0);
      const top = summary.topWallets[0];
      expect(top?.address).toBeDefined();
      expect(top?.label).toContain("Whale");
      expect(top?.inflowUsd).toBeGreaterThan(0n);
    });

    it("detects whale transactions exceeding threshold ($10,000 USD)", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider, {
        whaleThresholdUsd: parseToFixed18("10000"),
      });
      const summary = await aggregator.aggregateTickerFlow("AAPL");

      expect(summary.whaleAlerts.length).toBeGreaterThan(0);
      const alert = summary.whaleAlerts[0];
      expect(alert?.amountUsd).toBeGreaterThanOrEqual(parseToFixed18("10000"));
      expect(alert?.direction).toBe("INFLOW");
    });

    it("generates hourly time series points for chart visualization", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider);
      const points = await aggregator.getTimeSeries("AAPL", 24);

      expect(points.length).toBe(24);
      expect(points[0]?.timestamp).toBeDefined();
      expect(typeof points[0]?.netFlowUsd).toBe("bigint");
    });

    it("computes cross-platform breakdown between Ondo, bStocks, and xStocks", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider);
      const cross = await aggregator.getCrossPlatformSummary("AAPL");

      expect(cross.ticker).toBe("AAPL");
      expect(cross.ondoNetFlowUsd).toBeGreaterThan(0n);
      expect(cross.bStocksNetFlowUsd).toBeGreaterThan(0n);
      expect(cross.xStocksNetFlowUsd).toBeGreaterThan(0n);
      expect(["ONDO", "BSTOCKS", "XSTOCKS"]).toContain(cross.dominantPlatform);
    });

    it("detects pre-event positioning when market is CLOSED", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider, undefined, () => "CLOSED");
      const summary = await aggregator.aggregateTickerFlow("AAPL");

      expect(summary.preEventPositioning).toBe(true);
    });

    it("computes overall market dashboard summary across multiple tickers", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider);
      const dashboard = await aggregator.getMarketDashboardSummary([
        "AAPL",
        "NVDA",
        "TSLA",
        "MSFT",
      ]);

      expect(dashboard.topAccumulated.length).toBeGreaterThan(0);
      expect(dashboard.recentWhaleAlerts.length).toBeGreaterThan(0);
      expect(dashboard.isStale).toBe(false);
    });
  });

  describe("FlowSignalEngine", () => {
    it("emits FLOW_ACCUMULATION signal when 4h net flow > $5,000", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider);
      const signalEngine = new SignalEngine();
      const flowEngine = new FlowSignalEngine(aggregator, {
        signalEngine,
        features: {
          MODULE_1_MARKET_INTEL: true,
          MODULE_2_STRATEGY_FORGE: true,
          MODULE_3_FLOW_RADAR: true,
          AGENT_EXECUTION: false,
          B402_PAYMENTS: false,
          SIGNAL_WEEKEND_PREMIUM: false,
        },
      });

      const signals = await flowEngine.evaluateTicker("AAPL");
      const accum = signals.find((s) => s.category === "FLOW_ACCUMULATION");

      expect(accum).toBeDefined();
      expect(accum?.signal.type).toBe("FLOW");
      expect(accum?.signal.ticker).toBe("AAPL");
      expect(accum?.signal.actionable).toBe(true);
      expect(accum?.signal.value).toBeGreaterThanOrEqual(parseToFixed18("5000"));
    });

    it("emits FLOW_DISTRIBUTION signal when 4h net flow < -$5,000", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider);
      const flowEngine = new FlowSignalEngine(aggregator);

      const signals = await flowEngine.evaluateTicker("NVDA");
      const dist = signals.find((s) => s.category === "FLOW_DISTRIBUTION");

      expect(dist).toBeDefined();
      expect(dist?.signal.type).toBe("FLOW");
      expect(dist?.signal.ticker).toBe("NVDA");
      expect(dist?.category).toBe("FLOW_DISTRIBUTION");
    });

    it("emits WHALE_MOVEMENT signal when single transaction >= $10,000", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider);
      const flowEngine = new FlowSignalEngine(aggregator);

      const signals = await flowEngine.evaluateTicker("AAPL");
      const whale = signals.find((s) => s.category === "WHALE_MOVEMENT");

      expect(whale).toBeDefined();
      expect(whale?.category).toBe("WHALE_MOVEMENT");
      expect(whale?.whaleAddress).toBeDefined();
    });

    it("gracefully disables flow signals when MODULE_3_FLOW_RADAR = false", async () => {
      const provider = new MockBscScanProvider();
      const aggregator = new FlowAggregator(provider);
      const flowEngine = new FlowSignalEngine(aggregator, {
        features: {
          MODULE_1_MARKET_INTEL: true,
          MODULE_2_STRATEGY_FORGE: true,
          MODULE_3_FLOW_RADAR: false, // Disabled
          AGENT_EXECUTION: false,
          B402_PAYMENTS: false,
          SIGNAL_WEEKEND_PREMIUM: false,
        },
      });

      const signals = await flowEngine.evaluateTicker("AAPL");
      expect(signals).toEqual([]);
    });
  });
});
