// apps/backend/src/app.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp, createServices } from "./app.js";

describe("Backend API", () => {
  function createTestApp() {
    const services = createServices();
    const app = createApp(services);
    return { app, services };
  }

  it("GET /api/health returns 200 with status ok", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });

  it("GET /api/core/status returns market and feed availability", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/core/status");

    expect(res.status).toBe(200);
    expect(res.body.marketStatus).toBe("OPEN");
    expect(res.body.isOpen).toBe(true);
    expect(res.body.dataFeedAvailable).toBe(true);
  });

  it("GET /api/core/tokens returns serialized normalized token list", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/core/tokens");

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data)).toBe(true);

    const aapl = res.body.data.find((item: { ticker: string }) => item.ticker === "AAPL");
    expect(aapl).toBeDefined();
    expect(typeof aapl.tokenPrice).toBe("string");
    expect(typeof aapl.perSharePrice).toBe("string");
    expect(typeof aapl.oracleDivergenceBps).toBe("string");
  });

  it("GET /api/core/tokens/:ticker returns stock detail", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/core/tokens/AAPL");

    expect(res.status).toBe(200);
    expect(res.body.data.ticker).toBe("AAPL");
    expect(res.body.data.platform).toBeDefined();
  });

  it("GET /api/core/tokens/:ticker returns 404 for unknown ticker", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/core/tokens/UNKNOWN");

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it("GET /api/core/signals returns active signals", async () => {
    const { app } = createTestApp();
    const res = await request(app).get("/api/core/signals");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/core/policy/check validates trades against policy", async () => {
    const { app } = createTestApp();
    const res = await request(app)
      .post("/api/core/policy/check")
      .send({
        policy: {
          userId: "0x123",
          maxTradeNotionalUsd: "10.0",
          maxSlippageBps: "100",
          cooldownSeconds: 0,
          dailyLimitUsd: "50.0",
          allowedTokens: ["0xTokenA"],
          killSwitch: false,
        },
        trade: {
          ticker: "AAPL",
          tokenAddress: "0xTokenA",
          direction: "BUY",
          amountUsd: "5.0",
          expectedSlippageBps: "20",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(true);
    expect(res.body.reasonCode).toBeNull();
  });

  it("POST /api/core/policy/check rejects when kill switch is active", async () => {
    const { app } = createTestApp();
    const res = await request(app)
      .post("/api/core/policy/check")
      .send({
        policy: {
          userId: "0x123",
          maxTradeNotionalUsd: "10.0",
          maxSlippageBps: "100",
          cooldownSeconds: 0,
          dailyLimitUsd: "50.0",
          allowedTokens: ["0xTokenA"],
          killSwitch: true,
        },
        trade: {
          ticker: "AAPL",
          tokenAddress: "0xTokenA",
          direction: "BUY",
          amountUsd: "5.0",
          expectedSlippageBps: "20",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(false);
    expect(res.body.reasonCode).toBe("KILL_SWITCH");
  });

  it("GET /api/core/receipts/:user returns execution receipts for user", async () => {
    const { app, services } = createTestApp();
    services.receiptService.createReceipt({
      user: "0xUserA",
      signal: {
        id: "sig:1",
        type: "BASIS",
        ticker: "AAPL",
        severity: "info",
        value: 25n,
        context: {},
        timestamp: new Date(),
        actionable: true,
        regime: "ANY",
      },
      reasoning: "Basis rotation",
      simulationResult: {},
      quote: {},
      tokenIn: "0xUSDC",
      tokenOut: "0xAAPL",
      amountIn: "10",
      expectedAmountOut: "10",
      actualAmountOut: "10",
      slippageBps: 0,
    });

    const res = await request(app).get("/api/core/receipts/0xUserA");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].signalType).toBe("BASIS");
  });
});
