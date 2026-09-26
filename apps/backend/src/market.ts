// apps/backend/src/market.ts
//
// Module 1: Market Intelligence router (/api/market/* and /api/alpha/screener)
// Reference: Spectra.md §6.4

import { Router, type Request, type Response } from "express";
import type { BackendServices } from "./app.js";
import { serializeStock, serializeSignal } from "./app.js";
import type { NormalizedStock } from "@spectra/core";

export function createMarketRouter(services: BackendServices): Router {
  const router = Router();

  // GET /api/market/status (§6.4)
  router.get("/status", async (_req: Request, res: Response) => {
    try {
      const marketStatus = await services.ingestion.getMarketStatus();
      const isAvailable = services.ingestion.getIsAvailable();
      const lastFetchTime = services.ingestion.getLastFetchTime();

      res.json({
        isOpen: marketStatus.isOpen,
        status: marketStatus.status,
        nextOpenTime: marketStatus.nextOpenTime,
        dataFeedAvailable: isAvailable,
        lastFetchTime,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch market status" });
    }
  });

  // GET /api/market/heatmap (§6.4)
  // Provides hierarchical treemap data grouped by sector with signal color weights
  router.get("/heatmap", async (_req: Request, res: Response) => {
    try {
      const stocks = await services.normalization.getAll();
      services.signalEngine.evaluateAll(stocks);

      const items = stocks.map((stock) => {
        const raw = serializeStock(stock);
        const signals = services.signalEngine.getSignalsForTicker(stock.ticker);
        const hasHalt = signals.some((s) => s.severity === "critical");
        const hasWarning = signals.some((s) => s.severity === "warning");

        let signalColor = "#0ECB81"; // Normal green
        if (stock.marketStatus === "CLOSED") signalColor = "#787B86"; // Dim gray
        if (hasWarning) signalColor = "#F0B90B"; // Yellow warning
        if (hasHalt) signalColor = "#F6465D"; // Critical red

        return {
          ...raw,
          signals: signals.map(serializeSignal),
          signalColor,
          divergenceValue: stock.oracleDivergenceBps.toString(),
          basisValue: stock.crossPlatformBasisBps.toString(),
        };
      });

      res.json({
        total: items.length,
        data: items,
      });
    } catch {
      res.status(500).json({ error: "Failed to generate heatmap data" });
    }
  });

  // GET /api/market/screener (§6.4)
  // Filterable table by platform, sector, minDivergenceBps, minBasisBps, status
  router.get("/screener", async (req: Request, res: Response) => {
    try {
      const stocks = await services.normalization.getAll();
      services.signalEngine.evaluateAll(stocks);

      const {
        platform,
        marketStatus,
        minDivergenceBps,
        minBasisBps,
      } = req.query;

      let filtered: NormalizedStock[] = stocks;

      if (platform && typeof platform === "string") {
        filtered = filtered.filter(
          (s) => s.platform.toUpperCase() === platform.toUpperCase(),
        );
      }

      if (marketStatus && typeof marketStatus === "string") {
        filtered = filtered.filter(
          (s) => s.marketStatus.toUpperCase() === marketStatus.toUpperCase(),
        );
      }

      if (minDivergenceBps && typeof minDivergenceBps === "string") {
        const minDiv = BigInt(minDivergenceBps);
        filtered = filtered.filter((s) => {
          const abs = s.oracleDivergenceBps < 0n ? -s.oracleDivergenceBps : s.oracleDivergenceBps;
          return abs >= minDiv;
        });
      }

      if (minBasisBps && typeof minBasisBps === "string") {
        const minBasis = BigInt(minBasisBps);
        filtered = filtered.filter((s) => s.crossPlatformBasisBps >= minBasis);
      }

      const results = filtered.map((s) => {
        const serialized = serializeStock(s);
        const signals = services.signalEngine.getSignalsForTicker(s.ticker);
        return {
          ...serialized,
          activeSignalsCount: signals.length,
        };
      });

      res.json({
        count: results.length,
        totalTracked: stocks.length,
        data: results,
      });
    } catch {
      res.status(500).json({ error: "Failed to screen tokens" });
    }
  });

  // GET /api/market/ticker/:ticker (§6.4)
  router.get("/ticker/:ticker", async (req: Request, res: Response) => {
    try {
      const rawTicker = req.params.ticker;
      const ticker = (Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "").toUpperCase();

      const all = await services.normalization.getAll();
      const tickerStocks = all.filter((s) => s.ticker === ticker);

      if (tickerStocks.length === 0) {
        res.status(404).json({ error: `Ticker ${ticker} not found` });
        return;
      }

      const primary = tickerStocks[0]!;
      const signals = services.signalEngine.getSignalsForTicker(ticker);

      // Platform comparison breakdown
      const platforms = tickerStocks.map((s) => ({
        platform: s.platform,
        tokenAddress: s.tokenAddress,
        tokenPrice: serializeStock(s).tokenPrice,
        perSharePrice: serializeStock(s).perSharePrice,
        dexLiquidityUsd: serializeStock(s).dexLiquidityUsd,
        slippageBps: s.slippageBps.toString(),
      }));

      res.json({
        ticker,
        primary: serializeStock(primary),
        platforms,
        signals: signals.map(serializeSignal),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch ticker details" });
    }
  });

  // GET /api/market/sectors/:sector (§6.4)
  router.get("/sectors/:sector", async (req: Request, res: Response) => {
    try {
      const rawSector = req.params.sector;
      const sector = Array.isArray(rawSector) ? rawSector[0] ?? "" : rawSector ?? "";

      const rawTokens = await services.ingestion.getStockList();
      const matchingRaw = rawTokens.filter(
        (t) => t.sector && t.sector.toLowerCase() === sector.toLowerCase(),
      );

      const all = await services.normalization.getAll();
      const matchedTickers = new Set(matchingRaw.map((t) => t.ticker));
      const sectorStocks = all.filter((s) => matchedTickers.has(s.ticker));

      res.json({
        sector,
        count: sectorStocks.length,
        data: sectorStocks.map(serializeStock),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch sector tokens" });
    }
  });

  // GET /api/market/anomalies (§6.4)
  router.get("/anomalies", async (_req: Request, res: Response) => {
    try {
      const stocks = await services.normalization.getAll();
      services.signalEngine.evaluateAll(stocks);

      const signals = services.signalEngine.getActiveSignals();
      const anomalies = signals.filter(
        (s) => s.type === "ORACLE_DIVERGENCE" || s.type === "WEEKEND_PREMIUM" || s.type === "BASIS" || s.type === "RATIO_DRIFT",
      );

      res.json({
        count: anomalies.length,
        data: anomalies.map(serializeSignal),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch market anomalies" });
    }
  });

  return router;
}

export function createAlphaRouter(services: BackendServices): Router {
  const router = Router();

  // GET /api/alpha/screener (Paid b402 endpoint §5.6, §6.4)
  router.get("/screener", async (req: Request, res: Response) => {
    // If b402 payment header is missing in official mode, return 402 Payment Required (§5.6)
    const paymentHeader = req.headers["x-402-payment"];
    if (!paymentHeader && process.env.B402_MODE === "official") {
      res.status(402).json({
        x402Version: 2,
        error: "Payment Required",
        accepts: [
          {
            scheme: "exact",
            token: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC on BSC
            amount: "30000", // 0.03 USDC
            description: "Spectra Full Screener Export",
          },
        ],
      });
      return;
    }

    // Serve screener export
    const stocks = await services.normalization.getAll();
    services.signalEngine.evaluateAll(stocks);

    res.json({
      timestamp: new Date().toISOString(),
      source: "Spectra Market Intelligence Base Layer",
      count: stocks.length,
      data: stocks.map(serializeStock),
    });
  });

  // GET /api/alpha/flow/:ticker (Paid b402 endpoint §5.6, §6.4: 0.02 USDC)
  router.get("/flow/:ticker", async (req: Request, res: Response) => {
    const rawTicker = req.params.ticker;
    const ticker = (Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "").toUpperCase();

    // If b402 payment header is missing in official mode, return 402 Payment Required (§5.6)
    const paymentHeader = req.headers["x-402-payment"];
    if (!paymentHeader && process.env.B402_MODE === "official") {
      res.status(402).json({
        x402Version: 2,
        error: "Payment Required",
        accepts: [
          {
            scheme: "exact",
            token: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC on BSC
            amount: "20000", // 0.02 USDC
            description: `Spectra Smart Money Flow Alpha for ${ticker}`,
          },
        ],
      });
      return;
    }

    try {
      const summary = await services.flowAggregator.aggregateTickerFlow(ticker);
      await services.flowEngine.evaluateTicker(ticker);

      const sentiment =
        summary.netFlow4hUsd > 0n
          ? "ACCUMULATION"
          : summary.netFlow4hUsd < 0n
            ? "DISTRIBUTION"
            : "NEUTRAL";

      res.json({
        ticker,
        netFlow4hUsd: summary.netFlow4hUsd.toString(),
        netFlow24hUsd: summary.netFlow24hUsd.toString(),
        sentiment,
        topWalletsCount: summary.topWallets.length,
        whaleAlertsCount: summary.whaleAlerts.length,
        preEventPositioning: summary.preEventPositioning,
        dominantPlatform: summary.crossPlatform.dominantPlatform,
        timestamp: new Date().toISOString(),
        costUsd: "0.02",
      });
    } catch {
      res.status(500).json({ error: "Failed to generate smart money flow alpha" });
    }
  });

  return router;
}
