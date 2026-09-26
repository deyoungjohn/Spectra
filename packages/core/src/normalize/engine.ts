// packages/core/src/normalize/engine.ts
//
// Normalization Engine: converts raw on-chain token data and TradFi anchors
// into canonical NormalizedStock objects, enforcing per-share normalization
// via live tokenToShareRatio and detecting ratio drift.
// Reference: Spectra.md §2.3, §5.2, §5.10

import type { NormalizedStock } from "../types/normalized-stock.js";
import type { Platform } from "../types/platform.js";
import {
  toPerShare,
  spreadBps,
} from "./fixed-point.js";
import type { RawRwaToken, DataIngestionService } from "../services/data-ingestion.js";
import type { ITradFiClient, TradFiQuote } from "../services/tradfi.js";

export interface RatioDriftEvent {
  ticker: string;
  platform: Platform;
  oldRatio: bigint;
  newRatio: bigint;
  timestamp: Date;
}

export class NormalizationEngine {
  private ingestionService: DataIngestionService;
  private tradfiClient: ITradFiClient;
  private knownRatios = new Map<string, bigint>();
  private driftListeners: Array<(event: RatioDriftEvent) => void> = [];

  constructor(
    ingestionService: DataIngestionService,
    tradfiClient: ITradFiClient,
  ) {
    this.ingestionService = ingestionService;
    this.tradfiClient = tradfiClient;
  }

  /**
   * Register a listener for ratio drift events.
   */
  onRatioDrift(listener: (event: RatioDriftEvent) => void): () => void {
    this.driftListeners.push(listener);
    return () => {
      this.driftListeners = this.driftListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Normalize a single raw token against TradFi price and platform peers.
   */
  async normalizeToken(
    raw: RawRwaToken,
    peerTokens: RawRwaToken[] = [],
    tradfiQuote?: TradFiQuote | null,
  ): Promise<NormalizedStock> {
    const key = `${raw.ticker}:${raw.platform}`;
    const previousRatio = this.knownRatios.get(key);

    // Detect ratio drift (§5.3, §5.10)
    if (previousRatio !== undefined && previousRatio !== raw.tokenToShareRatio) {
      const event: RatioDriftEvent = {
        ticker: raw.ticker,
        platform: raw.platform,
        oldRatio: previousRatio,
        newRatio: raw.tokenToShareRatio,
        timestamp: new Date(),
      };
      for (const listener of this.driftListeners) {
        listener(event);
      }
    }
    this.knownRatios.set(key, raw.tokenToShareRatio);

    // 1. Convert to per-share price using live ratio: divFixed(tokenPrice, tokenToShareRatio)
    const perSharePrice =
      raw.tokenToShareRatio > 0n
        ? toPerShare(raw.tokenPrice, raw.tokenToShareRatio)
        : raw.tokenPrice;

    // 2. Fetch or use provided TradFi anchor
    const quote =
      tradfiQuote !== undefined
        ? tradfiQuote
        : await this.tradfiClient.getQuote(raw.ticker);
    const tradfiPrice = quote ? quote.price : 0n;

    // 3. Compute Oracle Divergence during OPEN market hours (§5.3 Signal A)
    let oracleDivergenceBps = 0n;
    if (raw.marketStatus === "OPEN" && tradfiPrice > 0n) {
      oracleDivergenceBps = spreadBps(perSharePrice, tradfiPrice);
    }

    // 4. Compute Weekend Sentiment Premium during CLOSED hours (§5.3 Signal B)
    let weekendPremiumBps = 0n;
    if (raw.marketStatus === "CLOSED" && tradfiPrice > 0n) {
      weekendPremiumBps = spreadBps(perSharePrice, tradfiPrice);
    }

    // 5. Compute Cross-Platform Basis (§5.3 Signal C)
    let crossPlatformBasisBps = 0n;
    const sameTickerPeers = peerTokens.filter((p) => p.ticker === raw.ticker);
    if (sameTickerPeers.length > 1) {
      // Find min and max per-share price across all platforms for this ticker
      let minPerShare = perSharePrice;
      let maxPerShare = perSharePrice;

      for (const peer of sameTickerPeers) {
        const peerPerShare =
          peer.tokenToShareRatio > 0n
            ? toPerShare(peer.tokenPrice, peer.tokenToShareRatio)
            : peer.tokenPrice;
        if (peerPerShare < minPerShare) minPerShare = peerPerShare;
        if (peerPerShare > maxPerShare) maxPerShare = peerPerShare;
      }

      if (minPerShare > 0n && maxPerShare > minPerShare) {
        crossPlatformBasisBps = spreadBps(maxPerShare, minPerShare);
      }
    }

    return {
      ticker: raw.ticker,
      platform: raw.platform,
      tokenAddress: raw.tokenAddress,
      tokenPrice: raw.tokenPrice,
      tokenToShareRatio: raw.tokenToShareRatio,
      perSharePrice,
      tradfiPrice,
      oracleDivergenceBps,
      weekendPremiumBps,
      crossPlatformBasisBps,
      dexLiquidityUsd: raw.dexLiquidityUsd,
      slippageBps: raw.slippageBps,
      marketStatus: raw.marketStatus,
      nextOpenTime: raw.nextOpenTime,
      lastUpdated: raw.lastUpdated,
    };
  }

  /**
   * Fetch all raw stocks and normalize them collectively.
   */
  async getAll(): Promise<NormalizedStock[]> {
    const rawTokens = await this.ingestionService.getStockList();
    if (rawTokens.length === 0) return [];

    // Pre-fetch TradFi quotes for unique tickers
    const uniqueTickers = [...new Set(rawTokens.map((t) => t.ticker))];
    const quotes = new Map<string, TradFiQuote | null>();
    await Promise.all(
      uniqueTickers.map(async (ticker) => {
        const quote = await this.tradfiClient.getQuote(ticker);
        quotes.set(ticker, quote);
      }),
    );

    const normalizedList: NormalizedStock[] = [];
    for (const raw of rawTokens) {
      const quote = quotes.get(raw.ticker) ?? null;
      const normalized = await this.normalizeToken(raw, rawTokens, quote);
      normalizedList.push(normalized);
    }

    return normalizedList;
  }

  /**
   * Fetch and normalize a single stock by ticker.
   */
  async getByTicker(ticker: string, platform?: Platform): Promise<NormalizedStock | null> {
    const all = await this.getAll();
    const upper = ticker.toUpperCase();
    if (platform) {
      return all.find((s) => s.ticker === upper && s.platform === platform) ?? null;
    }
    return all.find((s) => s.ticker === upper) ?? null;
  }
}
