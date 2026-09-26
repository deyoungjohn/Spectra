// apps/backend/src/app.test.ts
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp, type BackendServices } from "./app.js";
import {
  MemoryCacheService,
  DataIngestionService,
  MockRwaDataProvider,
  NormalizationEngine,
  CompositeTradFiClient,
  type ITradFiClient,
  parseToFixed18,
} from "@spectra/core";

describe("Backend API", () => {
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

    const services: BackendServices = { cache, ingestion, tradfi, normalization };
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
});
