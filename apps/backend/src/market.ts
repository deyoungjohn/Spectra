// apps/backend/src/market.ts
//
// Module 1: Market Intelligence router (/api/market/* and /api/alpha/screener)
// Reference: Spectra.md §6.4

import { Router, type Request, type Response } from "express";
import type { BackendServices } from "./app.js";
import { serializeStock, serializeSignal } from "./app.js";
import {
  type NormalizedStock,
  formatFixed18,
  BPS_PRECISION,
  type B402PaymentPayload,
  type PaymentRequirementOption,
  PaymentGateway,
} from "@spectra/core";

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
  const gateway = services.paymentGateway ?? new PaymentGateway();

  async function handlePaidAccess(
    req: Request,
    res: Response,
    endpointKey: string,
    amount: string
  ): Promise<boolean> {
    const requirements = gateway.createPaymentRequirements(endpointKey, amount, "USDC");
    const paymentHeader = req.headers["x-402-payment"];

    if (paymentHeader && typeof paymentHeader === "string") {
      try {
        const payload = JSON.parse(paymentHeader) as B402PaymentPayload;
        const reqOption: PaymentRequirementOption = requirements.accepts[0]!;
        const verifyResult = await gateway.verifyPayment(payload, reqOption);

        if (!verifyResult.valid) {
          res.status(402).json({
            x402Version: 2,
            error: "Payment Required",
            reason: verifyResult.reason,
            requirements,
          });
          return false;
        }

        const settleResult = await gateway.settlePayment(payload, reqOption);
        res.setHeader("X-402-Receipt", settleResult.settlementId);
        return true;
      } catch {
        res.status(400).json({ error: "Malformed X-402-Payment header" });
        return false;
      }
    }

    if (gateway.getMode() === "official" || process.env.B402_MODE === "official") {
      res.status(402).json(requirements);
      return false;
    }

    return true;
  }

  // GET /api/alpha/screener (Paid b402 endpoint §5.6, §6.4: 0.03 USDC)
  router.get("/screener", async (req: Request, res: Response) => {
    const ok = await handlePaidAccess(req, res, "screener", "30000");
    if (!ok) return;

    try {
      const stocks = await services.normalization.getAll();
      services.signalEngine.evaluateAll(stocks);

      res.json({
        timestamp: new Date().toISOString(),
        source: "Spectra Market Intelligence Base Layer",
        count: stocks.length,
        costUsd: "0.03",
        data: stocks.map(serializeStock),
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch screener data export" });
    }
  });

  // GET /api/alpha/flow/:ticker (Paid b402 endpoint §5.6, §6.4: 0.02 USDC)
  router.get("/flow/:ticker", async (req: Request, res: Response) => {
    const rawTicker = req.params.ticker;
    const ticker = (Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "").toUpperCase();

    const ok = await handlePaidAccess(req, res, "flow", "20000");
    if (!ok) return;

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

  // GET /api/alpha/oracle-divergence/:ticker (Paid b402 endpoint §5.6: 0.01 USDC)
  router.get("/oracle-divergence/:ticker", async (req: Request, res: Response) => {
    const rawTicker = req.params.ticker;
    const ticker = (Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "").toUpperCase();

    const ok = await handlePaidAccess(req, res, "oracleDivergence", "10000");
    if (!ok) return;

    try {
      const stocks = await services.normalization.getAll();
      const stock = stocks.find((s) => s.ticker.toUpperCase() === ticker);
      const tradFiQuote = await services.tradfi.getQuote(ticker);

      if (!stock || !tradFiQuote) {
        res.status(404).json({ error: `Ticker ${ticker} not found in normalized inventory` });
        return;
      }

      const diff = stock.perSharePrice - tradFiQuote.price;
      const divergenceBps = (diff * BPS_PRECISION) / tradFiQuote.price;
      const absBps = divergenceBps < 0n ? -divergenceBps : divergenceBps;

      const divergenceState =
        absBps > 50n ? "CRITICAL" : absBps > 20n ? "MODERATE" : "NORMAL";
      const direction =
        divergenceBps > 0n ? "OVERVALUED" : divergenceBps < 0n ? "UNDERVALUED" : "ALIGNED";

      res.json({
        ticker,
        divergenceBps: divergenceBps.toString(),
        divergenceState,
        direction,
        onChainPrice: formatFixed18(stock.perSharePrice),
        tradFiPrice: formatFixed18(tradFiQuote.price),
        platform: stock.platform,
        timestamp: Date.now(),
        costUsd: "0.01",
      });
    } catch {
      res.status(500).json({ error: `Failed to compute oracle divergence for ${ticker}` });
    }
  });

  // GET /api/alpha/weekend-premium/:ticker (Paid b402 endpoint §5.6: 0.01 USDC)
  router.get("/weekend-premium/:ticker", async (req: Request, res: Response) => {
    const rawTicker = req.params.ticker;
    const ticker = (Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "").toUpperCase();

    const ok = await handlePaidAccess(req, res, "weekendPremium", "10000");
    if (!ok) return;

    res.json({
      ticker,
      premiumBps: "0",
      active: false,
      featureFlagLocked: true,
      marketStatus: "FEATURE_LOCKED",
      note: "SIGNAL_WEEKEND_PREMIUM is locked to false per empirical finding in Spectra.md §5.8",
      timestamp: Date.now(),
      costUsd: "0.01",
    });
  });

  // GET /api/alpha/basis/:ticker (Paid b402 endpoint §5.6: 0.02 USDC)
  router.get("/basis/:ticker", async (req: Request, res: Response) => {
    const rawTicker = req.params.ticker;
    const ticker = (Array.isArray(rawTicker) ? rawTicker[0] ?? "" : rawTicker ?? "").toUpperCase();

    const ok = await handlePaidAccess(req, res, "basis", "20000");
    if (!ok) return;

    try {
      const allStocks = await services.normalization.getAll();
      const matching = allStocks.filter((s) => s.ticker.toUpperCase() === ticker);

      if (matching.length < 2) {
        res.json({
          ticker,
          spreadBps: "0",
          buyPlatform: matching[0]?.platform ?? "ONDO",
          sellPlatform: matching[0]?.platform ?? "ONDO",
          netProfitBps: "0",
          platformsTracked: matching.length,
          timestamp: Date.now(),
          costUsd: "0.02",
        });
        return;
      }

      // Sort by perSharePrice ascending
      matching.sort((a, b) => (a.perSharePrice < b.perSharePrice ? -1 : 1));
      const cheapest = matching[0]!;
      const mostExpensive = matching[matching.length - 1]!;

      const spreadBps = ((mostExpensive.perSharePrice - cheapest.perSharePrice) * BPS_PRECISION) / cheapest.perSharePrice;

      res.json({
        ticker,
        spreadBps: spreadBps.toString(),
        buyPlatform: cheapest.platform,
        buyPrice: formatFixed18(cheapest.perSharePrice),
        sellPlatform: mostExpensive.platform,
        sellPrice: formatFixed18(mostExpensive.perSharePrice),
        netProfitBps: spreadBps > 30n ? (spreadBps - 30n).toString() : "0",
        timestamp: Date.now(),
        costUsd: "0.02",
      });
    } catch {
      res.status(500).json({ error: `Failed to compute basis for ${ticker}` });
    }
  });

  // GET /api/alpha/signals (Paid b402 endpoint §5.6: 0.05 USDC)
  router.get("/signals", async (req: Request, res: Response) => {
    const ok = await handlePaidAccess(req, res, "signals", "50000");
    if (!ok) return;

    try {
      const signals = services.signalEngine.getActiveSignals();
      res.json({
        count: signals.length,
        signals: signals.map(serializeSignal),
        timestamp: Date.now(),
        costUsd: "0.05",
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch active alpha signals" });
    }
  });

  // POST /api/alpha/b402/verify (Utility endpoint for agent payment verification)
  router.post("/b402/verify", async (req: Request, res: Response) => {
    try {
      const { paymentPayload, paymentRequirements } = req.body as {
        paymentPayload?: B402PaymentPayload;
        paymentRequirements?: PaymentRequirementOption;
      };

      if (!paymentPayload || !paymentRequirements) {
        res.status(400).json({ error: "Missing paymentPayload or paymentRequirements" });
        return;
      }

      const result = await gateway.verifyPayment(paymentPayload, paymentRequirements);
      res.json(result);
    } catch {
      res.status(500).json({ error: "b402 verification failed" });
    }
  });

  // POST /api/alpha/b402/settle (Utility endpoint for payment settlement)
  router.post("/b402/settle", async (req: Request, res: Response) => {
    try {
      const { paymentPayload, paymentRequirements, settleAmount } = req.body as {
        paymentPayload?: B402PaymentPayload;
        paymentRequirements?: PaymentRequirementOption;
        settleAmount?: string;
      };

      if (!paymentPayload || !paymentRequirements) {
        res.status(400).json({ error: "Missing paymentPayload or paymentRequirements" });
        return;
      }

      const result = await gateway.settlePayment(paymentPayload, paymentRequirements, settleAmount);
      res.json(result);
    } catch {
      res.status(500).json({ error: "b402 settlement failed" });
    }
  });

  // GET /api/alpha/b402/supported (Readiness check per Spectra.md §5.6)
  router.get("/b402/supported", async (_req: Request, res: Response) => {
    const ready = await gateway.checkB402Readiness();
    res.json({
      code: "000000000",
      mode: gateway.getMode(),
      isUpstreamReady: ready,
      supportedAssets: ["USDC", "USDT", "USD1", "U"],
      networks: ["bsc", "bsc-testnet"],
      payTo: gateway.getPayTo(),
      timestamp: Date.now(),
    });
  });

  return router;
}
