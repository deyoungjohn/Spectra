// apps/backend/src/forge.test.ts
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

describe("Strategy Forge API (/api/forge/*)", () => {
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

  it("GET /api/forge/templates returns 4 canonical pre-built templates", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/forge/templates");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(4);
    expect(Array.isArray(res.body.data)).toBe(true);
    const ids = res.body.data.map((t: { id: string }) => t.id);
    expect(ids).toContain("dca-weekly");
    expect(ids).toContain("basis-rotation");
  });

  it("POST /api/forge/compile parses natural language to valid StrategyDSL", async () => {
    const { app } = createTestApp();
    const prompt =
      "Rotate my Ondo AAPL to bStocks AAPL whenever the cross-platform basis exceeds 20 bps and Flow Radar shows net accumulation above $5,000. Max trade $10, max slippage 1%.";

    const res = await request(app).post("/api/forge/compile").send({ prompt });

    expect(res.status).toBe(200);
    expect(res.body.dsl).toBeDefined();
    expect(res.body.dsl.name).toContain("AAPL Basis Rotation");
    expect(res.body.dsl.action.type).toBe("ROTATE");
    expect(res.body.validation.valid).toBe(true);
  });

  it("POST /api/forge/validate checks DSL syntax and policy bounds", async () => {
    const { app } = createTestApp();
    const validDsl = {
      name: "Simple DCA",
      trigger: { type: "MARKET_OPENS" },
      action: {
        type: "BUY",
        ticker: "AAPL",
        platform: "ONDO",
        amountUsd: "10.00",
      },
      policy: {
        maxTradeNotionalUsd: "10.00",
        maxSlippageBps: 100,
      },
    };

    const res = await request(app).post("/api/forge/validate").send({ dsl: validDsl });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it("POST /api/forge/simulate runs dry-run simulation and returns SHA-256 simulationHash", async () => {
    const { app } = createTestApp();
    const dsl = {
      name: "Basis Arbitrage Simulation",
      trigger: {
        type: "CROSS_PLATFORM_BASIS_ABOVE",
        ticker: "AAPL",
        basisBps: 20,
      },
      action: {
        type: "ROTATE",
        ticker: "AAPL",
        fromPlatform: "ONDO",
        toPlatform: "BSTOCKS",
      },
      policy: {
        maxTradeNotionalUsd: "10.00",
        maxSlippageBps: 100,
      },
    };

    const res = await request(app).post("/api/forge/simulate").send({ dsl });

    expect(res.status).toBe(200);
    expect(res.body.strategyName).toBe("Basis Arbitrage Simulation");
    expect(res.body.simulationHash).toBeDefined();
    expect(res.body.simulationHash.length).toBe(64);
    expect(res.body.status).toBe("SUCCESS");
  });

  it("POST /api/forge/deploy registers strategy with active status and ERC-8004 identity", async () => {
    const { app } = createTestApp();
    const dsl = {
      name: "Production Weekly DCA",
      trigger: { type: "TIME_SCHEDULE", cron: "0 13 * * 1" },
      action: {
        type: "BUY",
        ticker: "TSLA",
        platform: "ONDO",
        amountUsd: "10.00",
      },
      policy: {
        maxTradeNotionalUsd: "10.00",
        maxSlippageBps: 100,
      },
    };

    const res = await request(app).post("/api/forge/deploy").send({ dsl, userId: "user-alpha" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.strategy.status).toBe("ACTIVE");
    expect(res.body.strategy.agentIdentity).toContain("erc8004:bsc:agent-");
  });

  it("GET /api/forge/strategies lists deployed strategies", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/forge/strategies");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/forge/executions returns audit log with receipt hashes", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/forge/executions");

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.data[0].receiptHash).toBeDefined();
    expect(res.body.data[0].status).toBe("CONFIRMED");
  });
});
