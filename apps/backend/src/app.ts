// apps/backend/src/app.ts
//
// Express application setup for Spectra Base Layer API.
// Connects Ingestion Service, Normalization Engine, TradFi feeds,
// Signal Engine, Policy Engine, and Receipt Service.

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
  SignalEngine,
  PolicyEngine,
  ReceiptService,
  formatFixed18,
  parseToFixed18,
  type NormalizedStock,
  type AlphaSignal,
  type ExecutionPolicy,
  type TradeProposal,
} from "@spectra/core";

export interface BackendServices {
  cache: MemoryCacheService;
  ingestion: DataIngestionService;
  tradfi: CompositeTradFiClient;
  normalization: NormalizationEngine;
  signalEngine: SignalEngine;
  policyEngine: PolicyEngine;
  receiptService: ReceiptService;
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

  // Signals and Policy setup
  const signalEngine = new SignalEngine();
  // Hook ratio drift from normalization into signal engine
  normalization.onRatioDrift((event) => {
    signalEngine.handleRatioDrift(event);
  });

  const policyEngine = new PolicyEngine(signalEngine);
  const receiptService = new ReceiptService();

  return {
    cache,
    ingestion,
    tradfi,
    normalization,
    signalEngine,
    policyEngine,
    receiptService,
  };
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

/**
 * Format an AlphaSignal into a JSON-safe response
 */
export function serializeSignal(signal: AlphaSignal) {
  return {
    id: signal.id,
    type: signal.type,
    ticker: signal.ticker,
    severity: signal.severity,
    value: signal.value.toString(),
    context: signal.context,
    timestamp: signal.timestamp.toISOString(),
    actionable: signal.actionable,
    regime: signal.regime,
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
      // Also evaluate signals across active stocks
      services.signalEngine.evaluateAll(stocks);

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

  // Active signals list (§5.3)
  app.get("/api/core/signals", async (_req: Request, res: Response) => {
    try {
      const stocks = await services.normalization.getAll();
      services.signalEngine.evaluateAll(stocks);
      const activeSignals = services.signalEngine.getActiveSignals();

      res.json({
        count: activeSignals.length,
        data: activeSignals.map(serializeSignal),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch signals" });
    }
  });

  // Signals for a specific ticker
  app.get("/api/core/signals/:ticker", async (req: Request, res: Response) => {
    try {
      const rawTicker = req.params.ticker;
      const ticker = Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "";
      const signals = services.signalEngine.getSignalsForTicker(ticker);
      res.json({
        ticker: ticker.toUpperCase(),
        count: signals.length,
        data: signals.map(serializeSignal),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch ticker signals" });
    }
  });

  // Policy check endpoint (§5.4)
  app.post("/api/core/policy/check", (req: Request, res: Response) => {
    try {
      const body = req.body as {
        policy: {
          userId: string;
          maxTradeNotionalUsd: string;
          maxSlippageBps: string;
          cooldownSeconds: number;
          dailyLimitUsd: string;
          allowedTokens: string[];
          killSwitch: boolean;
        };
        trade: {
          ticker: string;
          tokenAddress: string;
          direction: "BUY" | "SELL";
          amountUsd: string;
          expectedSlippageBps: string;
        };
      };

      if (!body || !body.policy || !body.trade) {
        res.status(400).json({ error: "Missing policy or trade body" });
        return;
      }

      const policy: ExecutionPolicy = {
        userId: body.policy.userId,
        maxTradeNotionalUsd: parseToFixed18(body.policy.maxTradeNotionalUsd || "0"),
        maxSlippageBps: BigInt(body.policy.maxSlippageBps || "0"),
        cooldownSeconds: body.policy.cooldownSeconds || 0,
        dailyLimitUsd: parseToFixed18(body.policy.dailyLimitUsd || "0"),
        allowedTokens: body.policy.allowedTokens || [],
        killSwitch: Boolean(body.policy.killSwitch),
      };

      const trade: TradeProposal = {
        ticker: body.trade.ticker,
        tokenAddress: body.trade.tokenAddress,
        direction: body.trade.direction,
        amountUsd: parseToFixed18(body.trade.amountUsd || "0"),
        expectedSlippageBps: BigInt(body.trade.expectedSlippageBps || "0"),
      };

      const checkResult = services.policyEngine.checkTrade(policy, trade);
      res.json(checkResult);
    } catch {
      res.status(500).json({ error: "Failed to evaluate policy" });
    }
  });

  // Receipts list for a user (§5.5)
  app.get("/api/core/receipts/:user", (req: Request, res: Response) => {
    try {
      const rawUser = req.params.user;
      const user = Array.isArray(rawUser) ? rawUser[0] ?? "" : rawUser ?? "";
      const receipts = services.receiptService.getReceiptsByUser(user);
      res.json({
        user,
        count: receipts.length,
        data: receipts,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch user receipts" });
    }
  });

  return app;
}
