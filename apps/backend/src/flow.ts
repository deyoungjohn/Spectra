// apps/backend/src/flow.ts
//
// Module 3: Flow Radar router (/api/flow/* and paid /api/alpha/flow/:ticker)
// Reference: Spectra.md §5.6, §6.4, §8

import { Router, type Request, type Response } from "express";
import type { BackendServices } from "./app.js";
import { formatFixed18, type TickerFlowSummary, type WalletFlowSummary, type WhaleAlert, type FlowTimeSeriesPoint, type CrossPlatformFlowSummary } from "@spectra/core";

export function serializeWalletSummary(w: WalletFlowSummary) {
  return {
    address: w.address,
    label: w.label,
    ticker: w.ticker,
    inflowUsd: formatFixed18(w.inflowUsd),
    outflowUsd: formatFixed18(w.outflowUsd),
    netFlowUsd: formatFixed18(w.netFlowUsd),
    holdingUsd: formatFixed18(w.holdingUsd),
    txCount: w.txCount,
    lastActive: w.lastActive.toISOString(),
  };
}

export function serializeWhaleAlert(a: WhaleAlert) {
  return {
    id: a.id,
    hash: a.hash,
    timestamp: a.timestamp.toISOString(),
    ticker: a.ticker,
    platform: a.platform,
    wallet: a.wallet,
    walletLabel: a.walletLabel,
    direction: a.direction,
    amountTokens: formatFixed18(a.amountTokens),
    amountUsd: formatFixed18(a.amountUsd),
  };
}

export function serializeTimeSeriesPoint(p: FlowTimeSeriesPoint) {
  return {
    timestamp: p.timestamp,
    inflowUsd: formatFixed18(p.inflowUsd),
    outflowUsd: formatFixed18(p.outflowUsd),
    netFlowUsd: formatFixed18(p.netFlowUsd),
  };
}

export function serializeCrossPlatformSummary(c: CrossPlatformFlowSummary) {
  return {
    ticker: c.ticker,
    ondoNetFlowUsd: formatFixed18(c.ondoNetFlowUsd),
    bStocksNetFlowUsd: formatFixed18(c.bStocksNetFlowUsd),
    xStocksNetFlowUsd: formatFixed18(c.xStocksNetFlowUsd),
    totalNetFlowUsd: formatFixed18(c.totalNetFlowUsd),
    dominantPlatform: c.dominantPlatform,
  };
}

export function serializeTickerSummary(s: TickerFlowSummary) {
  return {
    ticker: s.ticker,
    netFlow1hUsd: formatFixed18(s.netFlow1hUsd),
    netFlow4hUsd: formatFixed18(s.netFlow4hUsd),
    netFlow24hUsd: formatFixed18(s.netFlow24hUsd),
    inflow24hUsd: formatFixed18(s.inflow24hUsd),
    outflow24hUsd: formatFixed18(s.outflow24hUsd),
    topWallets: s.topWallets.map(serializeWalletSummary),
    whaleAlerts: s.whaleAlerts.map(serializeWhaleAlert),
    preEventPositioning: s.preEventPositioning,
    crossPlatform: serializeCrossPlatformSummary(s.crossPlatform),
  };
}

export function createFlowRouter(services: BackendServices): Router {
  const router = Router();

  // GET /api/flow/status (§8.2, §5.10)
  router.get("/status", async (_req: Request, res: Response) => {
    try {
      res.json({
        module: "FLOW_RADAR",
        enabled: true,
        bscScanHealthy: true,
        trackedTickers: ["AAPL", "NVDA", "TSLA", "MSFT"],
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch flow status" });
    }
  });

  // GET /api/flow/summary (§8.2, §8.4)
  router.get("/summary", async (_req: Request, res: Response) => {
    try {
      const tickers = ["AAPL", "NVDA", "TSLA", "MSFT"];
      const summary = await services.flowAggregator.getMarketDashboardSummary(tickers);

      res.json({
        totalMarketNetFlow24hUsd: formatFixed18(summary.totalMarketNetFlow24hUsd),
        topAccumulated: summary.topAccumulated.map((item) => ({
          ticker: item.ticker,
          netFlow24hUsd: formatFixed18(item.netFlow24hUsd),
          dominantPlatform: item.dominantPlatform,
        })),
        topDistributed: summary.topDistributed.map((item) => ({
          ticker: item.ticker,
          netFlow24hUsd: formatFixed18(item.netFlow24hUsd),
          dominantPlatform: item.dominantPlatform,
        })),
        recentWhaleAlerts: summary.recentWhaleAlerts.map(serializeWhaleAlert),
        lastUpdated: summary.lastUpdated.toISOString(),
        isStale: summary.isStale,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch flow dashboard summary" });
    }
  });

  // GET /api/flow/ticker/:ticker (§8.2, §8.4)
  router.get("/ticker/:ticker", async (req: Request, res: Response) => {
    try {
      const rawTicker = req.params.ticker;
      const ticker = (Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "").toUpperCase();
      const summary = await services.flowAggregator.aggregateTickerFlow(ticker);

      // Also evaluate flow signals for this ticker
      await services.flowEngine.evaluateTicker(ticker);

      res.json(serializeTickerSummary(summary));
    } catch {
      res.status(500).json({ error: "Failed to fetch ticker flow summary" });
    }
  });

  // GET /api/flow/chart/:ticker (§8.2, §8.4)
  router.get("/chart/:ticker", async (req: Request, res: Response) => {
    try {
      const rawTicker = req.params.ticker;
      const ticker = (Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "").toUpperCase();
      const rawHours = req.query.hours;
      const hours = typeof rawHours === "string" ? parseInt(rawHours, 10) || 24 : 24;

      const points = await services.flowAggregator.getTimeSeries(ticker, hours);
      res.json({
        ticker,
        hours,
        data: points.map(serializeTimeSeriesPoint),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch flow time series" });
    }
  });

  // GET /api/flow/whales (§8.1, §8.4)
  router.get("/whales", async (req: Request, res: Response) => {
    try {
      const rawTicker = req.query.ticker;
      const ticker = typeof rawTicker === "string" ? rawTicker.toUpperCase() : undefined;
      const rawLimit = req.query.limit;
      const limit = typeof rawLimit === "string" ? parseInt(rawLimit, 10) || 20 : 20;

      const alerts = await services.flowAggregator.getWhaleAlerts(ticker, limit);
      res.json({
        count: alerts.length,
        data: alerts.map(serializeWhaleAlert),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch whale alerts" });
    }
  });

  // GET /api/flow/cross-platform (§8.1, §8.4)
  router.get("/cross-platform", async (req: Request, res: Response) => {
    try {
      const rawTicker = req.query.ticker;
      const ticker = (typeof rawTicker === "string" ? rawTicker : "AAPL").toUpperCase();

      const cross = await services.flowAggregator.getCrossPlatformSummary(ticker);
      res.json(serializeCrossPlatformSummary(cross));
    } catch {
      res.status(500).json({ error: "Failed to fetch cross-platform flow" });
    }
  });

  return router;
}
