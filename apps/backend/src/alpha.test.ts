// apps/backend/src/alpha.test.ts
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
  HttpBscScanClient,
  FlowAggregator,
  FlowSignalEngine,
  type ITradFiClient,
  parseToFixed18,
  PaymentGateway,
  BnbAgentStudioClient,
  AgenticWalletClient,
  type B402PaymentPayload,
  type PaymentRequirementOption,
} from "@spectra/core";

describe("b402 Paid Alpha Endpoints (/api/alpha/*)", () => {
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

  function createValidPayload(payTo: string, amount: string = "10000"): B402PaymentPayload {
    return {
      x402Version: 2,
      payer: "0x1111111111111111111111111111111111111111",
      payTo,
      asset: "USDC",
      amount,
      network: "bsc",
      nonce: "nonce-12345",
      deadline: Math.floor(Date.now() / 1000) + 3600,
      signature: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    };
  }

  it("GET /api/alpha/oracle-divergence/:ticker returns 200 with valid payment", async () => {
    const { app, services } = createTestApp();
    const payTo = services.paymentGateway.getPayTo();
    const payload = createValidPayload(payTo, "10000");

    const res = await request(app)
      .get("/api/alpha/oracle-divergence/AAPL")
      .set("x-402-payment", JSON.stringify(payload));

    expect(res.status).toBe(200);
    expect(res.body.ticker).toBe("AAPL");
    expect(res.body.divergenceBps).toBeDefined();
    expect(res.body.divergenceState).toBeDefined();
    expect(res.headers["x-402-receipt"]).toMatch(/^b402-shadow-/);
  });

  it("GET /api/alpha/weekend-premium/:ticker returns feature locked status", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/alpha/weekend-premium/AAPL");

    expect(res.status).toBe(200);
    expect(res.body.ticker).toBe("AAPL");
    expect(res.body.active).toBe(false);
    expect(res.body.featureFlagLocked).toBe(true);
  });

  it("GET /api/alpha/basis/:ticker returns cross-platform basis", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/alpha/basis/AAPL");

    expect(res.status).toBe(200);
    expect(res.body.ticker).toBe("AAPL");
    expect(res.body.spreadBps).toBeDefined();
    expect(res.body.buyPlatform).toBeDefined();
  });

  it("GET /api/alpha/signals returns active alpha signals", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/alpha/signals");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.signals)).toBe(true);
    expect(res.body.count).toBeDefined();
  });

  it("Returns 402 Payment Required in official mode when payment header is missing", async () => {
    const { app, services } = createTestApp();
    services.paymentGateway.setMode("official");

    const res = await request(app).get("/api/alpha/oracle-divergence/AAPL");
    expect(res.status).toBe(402);
    expect(res.body.x402Version).toBe(2);
    expect(res.body.error).toBe("Payment Required");
    expect(res.body.accepts[0].amount).toBe("10000");
    expect(res.body.accepts[0].extensions?.bazaar).toBeDefined();
  });

  it("Returns 402 if payment payload is expired or invalid", async () => {
    const { app, services } = createTestApp();
    const payTo = services.paymentGateway.getPayTo();
    const expiredPayload: B402PaymentPayload = {
      ...createValidPayload(payTo, "10000"),
      deadline: Math.floor(Date.now() / 1000) - 100, // Expired
    };

    const res = await request(app)
      .get("/api/alpha/oracle-divergence/AAPL")
      .set("x-402-payment", JSON.stringify(expiredPayload));

    expect(res.status).toBe(402);
    expect(res.body.reason).toContain("expired");
  });

  it("POST /api/alpha/b402/verify verifies payment payload", async () => {
    const { app, services } = createTestApp();
    const payTo = services.paymentGateway.getPayTo();
    const paymentPayload = createValidPayload(payTo, "20000");
    const paymentRequirements: PaymentRequirementOption = {
      scheme: "exact",
      asset: "USDC",
      network: "bsc",
      amount: "20000",
      payTo,
    };

    const res = await request(app)
      .post("/api/alpha/b402/verify")
      .send({ paymentPayload, paymentRequirements });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.code).toBe("000000000");
  });

  it("POST /api/alpha/b402/settle settles payment and returns receipt hash", async () => {
    const { app, services } = createTestApp();
    const payTo = services.paymentGateway.getPayTo();
    const paymentPayload = createValidPayload(payTo, "30000");
    const paymentRequirements: PaymentRequirementOption = {
      scheme: "exact",
      asset: "USDC",
      network: "bsc",
      amount: "30000",
      payTo,
    };

    const res = await request(app)
      .post("/api/alpha/b402/settle")
      .send({ paymentPayload, paymentRequirements });

    expect(res.status).toBe(200);
    expect(res.body.settled).toBe(true);
    expect(res.body.settlementId).toMatch(/^b402-shadow-/);
    expect(res.body.txHash).toBeDefined();
  });

  it("GET /api/alpha/b402/supported returns supported payment metadata", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/alpha/b402/supported");

    expect(res.status).toBe(200);
    expect(res.body.code).toBe("000000000");
    expect(res.body.supportedAssets).toContain("USDC");
    expect(res.body.networks).toContain("bsc");
  });
});
