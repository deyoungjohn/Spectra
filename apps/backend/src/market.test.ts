// apps/backend/src/market.test.ts
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
  type ITradFiClient,
  parseToFixed18,
  HttpBscScanClient,
  FlowAggregator,
  FlowSignalEngine,
  PaymentGateway,
  BnbAgentStudioClient,
  AgenticWalletClient,
} from "@spectra/core";

describe("Market Intelligence API (/api/market/* & /api/alpha/*)", () => {
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

    const bscScan = new HttpBscScanClient({ cache });
    const flowAggregator = new FlowAggregator(bscScan);
    const flowEngine = new FlowSignalEngine(flowAggregator, { signalEngine });
    const paymentGateway = new PaymentGateway({ mode: "shadow" });
    const agentStudio = new BnbAgentStudioClient();
    const agenticWallet = new AgenticWalletClient(policyEngine);

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
      paymentGateway,
      agentStudio,
      agenticWallet,
    };
    const app = createApp(services);
    return { app, services };
  }

  it("GET /api/market/status returns open state and next open time", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/market/status");

    expect(res.status).toBe(200);
    expect(res.body.isOpen).toBe(true);
    expect(res.body.status).toBe("OPEN");
    expect(res.body.dataFeedAvailable).toBe(true);
  });

  it("GET /api/market/heatmap returns color-coded treemap entries", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/market/heatmap");

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data)).toBe(true);

    const first = res.body.data[0];
    expect(first.signalColor).toBeDefined();
    expect(typeof first.divergenceValue).toBe("string");
    expect(typeof first.basisValue).toBe("string");
  });

  it("GET /api/market/screener supports filtering by platform and anomaly spread", async () => {
    const { app } = createTestApp();

    // Query without filter
    const resAll = await request(app).get("/api/market/screener");
    expect(resAll.status).toBe(200);
    expect(resAll.body.count).toBeGreaterThan(0);

    // Query filter by platform=ONDO
    const resOndo = await request(app).get("/api/market/screener?platform=ONDO");
    expect(resOndo.status).toBe(200);
    for (const item of resOndo.body.data) {
      expect(item.platform).toBe("ONDO");
    }

    // Query filter by minBasisBps=10
    const resBasis = await request(app).get("/api/market/screener?minBasisBps=10");
    expect(resBasis.status).toBe(200);
  });

  it("GET /api/market/ticker/:ticker returns multi-platform price comparison", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/market/ticker/AAPL");

    expect(res.status).toBe(200);
    expect(res.body.ticker).toBe("AAPL");
    expect(res.body.primary).toBeDefined();
    expect(Array.isArray(res.body.platforms)).toBe(true);
    // AAPL is on both ONDO and BSTOCKS in mock data
    expect(res.body.platforms.length).toBeGreaterThanOrEqual(2);
  });

  it("GET /api/market/sectors/:sector returns stocks filtered by sector", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/market/sectors/Magnificent%207");

    expect(res.status).toBe(200);
    expect(res.body.sector).toBe("Magnificent 7");
    expect(res.body.count).toBeGreaterThan(0);
  });

  it("GET /api/market/anomalies returns filtered anomaly signals", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/market/anomalies");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/alpha/screener returns full screener data export", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/alpha/screener");

    expect(res.status).toBe(200);
    expect(res.body.source).toBe("Spectra Market Intelligence Base Layer");
    expect(res.body.count).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
