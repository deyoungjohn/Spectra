// apps/backend/src/flow.test.ts
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp, type BackendServices } from "./app.js";
import {
  MemoryCacheService,
  DataIngestionService,
  MockRwaDataProvider,
  NormalizationEngine,
  CompositeTradFiClient,
  SignalEngine,
  PolicyEngine,
  ReceiptService,
  MockBscScanProvider,
  FlowAggregator,
  FlowSignalEngine,
  type ITradFiClient,
  parseToFixed18,
} from "@spectra/core";

describe("Flow Radar API (/api/flow/* & /api/alpha/flow/*)", () => {
  function createTestApp() {
    const cache = new MemoryCacheService();
    const mockTradFi: ITradFiClient = {
      getQuote: vi.fn().mockResolvedValue({
        ticker: "AAPL",
        price: parseToFixed18("333.90"),
        timestamp: new Date(),
        source: "mock",
      }),
    };
    const tradfi = new CompositeTradFiClient(mockTradFi, mockTradFi, { cache });
    const ingestion = new DataIngestionService(new MockRwaDataProvider(), { cache });
    const normalization = new NormalizationEngine(ingestion, tradfi);
    const signalEngine = new SignalEngine();
    const policyEngine = new PolicyEngine(signalEngine);
    const receiptService = new ReceiptService();

    const bscScan = new MockBscScanProvider();
    const flowAggregator = new FlowAggregator(bscScan);
    const flowEngine = new FlowSignalEngine(flowAggregator, { signalEngine });

    const services: BackendServices = {
      cache,
      ingestion,
      tradfi,
      normalization,
      signalEngine,
      policyEngine,
      receiptService,
      bscScan,
      flowAggregator,
      flowEngine,
    };
    const app = createApp(services);
    return { app, services };
  }

  it("GET /api/flow/status returns 200 with module health and tracked tickers", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/flow/status");

    expect(res.status).toBe(200);
    expect(res.body.module).toBe("FLOW_RADAR");
    expect(res.body.enabled).toBe(true);
    expect(res.body.bscScanHealthy).toBe(true);
    expect(res.body.trackedTickers).toContain("AAPL");
  });

  it("GET /api/flow/summary returns top accumulated, distributed, and whale alerts", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/flow/summary");

    expect(res.status).toBe(200);
    expect(typeof res.body.totalMarketNetFlow24hUsd).toBe("string");
    expect(Array.isArray(res.body.topAccumulated)).toBe(true);
    expect(Array.isArray(res.body.recentWhaleAlerts)).toBe(true);
  });

  it("GET /api/flow/ticker/:ticker returns full metrics, top wallets, and crossPlatform breakdown", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/flow/ticker/AAPL");

    expect(res.status).toBe(200);
    expect(res.body.ticker).toBe("AAPL");
    expect(res.body.netFlow1hUsd).toBeDefined();
    expect(res.body.netFlow4hUsd).toBeDefined();
    expect(res.body.netFlow24hUsd).toBeDefined();
    expect(Array.isArray(res.body.topWallets)).toBe(true);
    expect(res.body.topWallets.length).toBeGreaterThan(0);
    expect(res.body.crossPlatform.ticker).toBe("AAPL");
  });

  it("GET /api/flow/chart/:ticker returns hourly time series points", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/flow/chart/AAPL?hours=24");

    expect(res.status).toBe(200);
    expect(res.body.ticker).toBe("AAPL");
    expect(res.body.hours).toBe(24);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(24);
    expect(res.body.data[0].timestamp).toBeDefined();
    expect(res.body.data[0].netFlowUsd).toBeDefined();
  });

  it("GET /api/flow/whales returns whale alerts filtered by ticker and limit", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/flow/whales?ticker=AAPL&limit=5");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it("GET /api/flow/cross-platform returns platform breakdown for ticker", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/flow/cross-platform?ticker=AAPL");

    expect(res.status).toBe(200);
    expect(res.body.ticker).toBe("AAPL");
    expect(res.body.ondoNetFlowUsd).toBeDefined();
    expect(res.body.bStocksNetFlowUsd).toBeDefined();
    expect(res.body.xStocksNetFlowUsd).toBeDefined();
    expect(["ONDO", "BSTOCKS", "XSTOCKS"]).toContain(res.body.dominantPlatform);
  });

  it("GET /api/alpha/flow/:ticker returns smart money flow alpha", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/alpha/flow/AAPL");

    expect(res.status).toBe(200);
    expect(res.body.ticker).toBe("AAPL");
    expect(res.body.sentiment).toBeDefined();
    expect(res.body.netFlow4hUsd).toBeDefined();
    expect(res.body.costUsd).toBe("0.02");
  });

  it("GET /api/alpha/flow/:ticker returns 402 Payment Required in official mode without header", async () => {
    const prevMode = process.env.B402_MODE;
    process.env.B402_MODE = "official";
    try {
      const { app } = createTestApp();
      const res = await request(app).get("/api/alpha/flow/AAPL");

      expect(res.status).toBe(402);
      expect(res.body.x402Version).toBe(2);
      expect(res.body.error).toBe("Payment Required");
      expect(res.body.accepts[0].amount).toBe("20000"); // 0.02 USDC
    } finally {
      process.env.B402_MODE = prevMode;
    }
  });
});
