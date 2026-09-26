// apps/backend/src/app.ts
//
// Express application setup for Spectra Base Layer API.
// Connects Ingestion Service, Normalization Engine, and TradFi feeds.

import express, { type Request, type Response } from "express";
import {
  DataIngestionService,
  MockRwaDataProvider,
  BinanceRwaDataProvider,
  NormalizationEngine,
  CompositeTradFiClient,
  FinnhubClient,
  YFinanceClient,
  MemoryCacheService,
  formatFixed18,
  type NormalizedStock,
} from "@spectra/core";

export interface BackendServices {
  cache: MemoryCacheService;
  ingestion: DataIngestionService;
  tradfi: CompositeTradFiClient;
  normalization: NormalizationEngine;
}

export function createServices(env: NodeJS.ProcessEnv = process.env): BackendServices {
  const cache = new MemoryCacheService();

  // TradFi setup
  const finnhub = new FinnhubClient(env.FINNHUB_API_KEY ?? "");
  const yfinance = new YFinanceClient();
  const tradfi = new CompositeTradFiClient(finnhub, yfinance, { cache, cacheTtlSeconds: 120 });

  // RWA data provider setup
  const rwaProvider = env.BINANCE_API_KEY
    ? new BinanceRwaDataProvider({
        baseUrl: env.BINANCE_RWA_BASE_URL,
        apiKey: env.BINANCE_API_KEY,
      })
    : new MockRwaDataProvider();

  const ingestion = new DataIngestionService(rwaProvider, { cache, cacheTtlSeconds: 60 });
  const normalization = new NormalizationEngine(ingestion, tradfi);

  return { cache, ingestion, tradfi, normalization };
}

/**
 * Format a NormalizedStock into a JSON-safe response (BigInts converted to strings)
 */
export function serializeStock(stock: NormalizedStock) {
  return {
    ticker: stock.ticker,
    platform: stock.platform,
    tokenAddress: stock.tokenAddress,
    tokenPrice: formatFixed18(stock.tokenPrice),
    tokenToShareRatio: formatFixed18(stock.tokenToShareRatio),
    perSharePrice: formatFixed18(stock.perSharePrice),
    tradfiPrice: formatFixed18(stock.tradfiPrice),
    oracleDivergenceBps: stock.oracleDivergenceBps.toString(),
    weekendPremiumBps: stock.weekendPremiumBps.toString(),
    crossPlatformBasisBps: stock.crossPlatformBasisBps.toString(),
    dexLiquidityUsd: formatFixed18(stock.dexLiquidityUsd),
    slippageBps: stock.slippageBps.toString(),
    marketStatus: stock.marketStatus,
    nextOpenTime: stock.nextOpenTime,
    lastUpdated: stock.lastUpdated,
  };
}

export function createApp(services: BackendServices): express.Application {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // System and market status (§5.1, §5.10)
  app.get("/api/core/status", async (_req: Request, res: Response) => {
    try {
      const marketStatus = await services.ingestion.getMarketStatus();
      const isAvailable = services.ingestion.getIsAvailable();
      const lastFetchTime = services.ingestion.getLastFetchTime();

      res.json({
        marketStatus: marketStatus.status,
        isOpen: marketStatus.isOpen,
        nextOpenTime: marketStatus.nextOpenTime,
        dataFeedAvailable: isAvailable,
        lastFetchTime,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  // Normalized token list (§5.2)
  app.get("/api/core/tokens", async (_req: Request, res: Response) => {
    try {
      const stocks = await services.normalization.getAll();
      res.json({
        count: stocks.length,
        data: stocks.map(serializeStock),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch normalized tokens" });
    }
  });

  // Single normalized token detail
  app.get("/api/core/tokens/:ticker", async (req: Request, res: Response) => {
    try {
      const rawTicker = req.params.ticker;
      const ticker = Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "";
      const stock = await services.normalization.getByTicker(ticker);
      if (!stock) {
        res.status(404).json({ error: `Stock ${ticker} not found` });
        return;
      }
      res.json({ data: serializeStock(stock) });
    } catch {
      res.status(500).json({ error: "Failed to fetch stock" });
    }
  });

  return app;
}
