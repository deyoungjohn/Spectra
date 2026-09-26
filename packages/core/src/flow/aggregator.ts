// packages/core/src/flow/aggregator.ts
//
// Flow Aggregator for Module 3: Flow Radar.
// Groups by ticker + platform, identifies top-N wallets, computes net flow
// across time windows (1h, 4h, 24h), pre-event positioning, and time series.
// Reference: Spectra.md §8.1, §8.2

import type { Platform, MarketStatus } from "../types/platform.js";
import { parseToFixed18 } from "../normalize/fixed-point.js";
import type {
  BscScanProvider,
  TickerFlowSummary,
  WalletFlowSummary,
  WhaleAlert,
  FlowTimeSeriesPoint,
  CrossPlatformFlowSummary,
  FlowDashboardSummary,
} from "./types.js";

export interface FlowAggregatorConfig {
  whaleThresholdUsd?: bigint; // Default: $10,000
  topWalletsLimit?: number; // Default: 10
}

/** Addresses considered DEX liquidity pools or bridge contracts */
const KNOWN_POOLS = new Set([
  "0x1111111254fb6c44bac0bed2854e76f90643097d".toLowerCase(), // PancakeSwap / 1inch pool
  "0x0000000000000000000000000000000000000000", // Mint
]);

export class FlowAggregator {
  private provider: BscScanProvider;
  private whaleThresholdUsd: bigint;
  private topWalletsLimit: number;
  private marketStatusResolver?: (ticker: string) => MarketStatus;

  constructor(
    provider: BscScanProvider,
    config?: FlowAggregatorConfig,
    marketStatusResolver?: (ticker: string) => MarketStatus,
  ) {
    this.provider = provider;
    this.whaleThresholdUsd = config?.whaleThresholdUsd ?? parseToFixed18("10000");
    this.topWalletsLimit = config?.topWalletsLimit ?? 10;
    this.marketStatusResolver = marketStatusResolver;
  }

  /**
   * Aggregate flow metrics for a specific ticker over 1h, 4h, and 24h windows.
   */
  async aggregateTickerFlow(
    ticker: string,
    options?: { now?: Date },
  ): Promise<TickerFlowSummary> {
    const upper = ticker.toUpperCase();
    const transfers = await this.provider.getTokenTransfers({ ticker: upper });
    const nowMs = (options?.now ?? new Date()).getTime();

    const ONE_HOUR = 3600 * 1000;
    const FOUR_HOURS = 4 * ONE_HOUR;
    const TWENTY_FOUR_HOURS = 24 * ONE_HOUR;

    let netFlow1hUsd = 0n;
    let netFlow4hUsd = 0n;
    let netFlow24hUsd = 0n;
    let inflow24hUsd = 0n;
    let outflow24hUsd = 0n;

    // Cross-platform accumulators
    let ondoNetFlowUsd = 0n;
    let bStocksNetFlowUsd = 0n;
    let xStocksNetFlowUsd = 0n;

    // Wallet accumulators
    const walletMap = new Map<
      string,
      {
        inflow: bigint;
        outflow: bigint;
        txCount: number;
        lastActive: Date;
      }
    >();

    const whaleAlerts: WhaleAlert[] = [];
    let hasPreEventActivity = false;
    const currentMarketStatus = this.marketStatusResolver
      ? this.marketStatusResolver(upper)
      : "OPEN";

    for (const tx of transfers) {
      const txTimeMs = tx.timestamp.getTime();
      const ageMs = nowMs - txTimeMs;

      // Classify if transfer is inflow (user buying from DEX or receiving) or outflow (user selling to DEX)
      const isFromPool = KNOWN_POOLS.has(tx.from.toLowerCase());
      const isToPool = KNOWN_POOLS.has(tx.to.toLowerCase());

      let netDelta = 0n;
      if (isFromPool && !isToPool) {
        // Pool -> User = Net inflow into user wallet (buying)
        netDelta = tx.valueUsd;
      } else if (!isFromPool && isToPool) {
        // User -> Pool = Net outflow from user wallet (selling)
        netDelta = -tx.valueUsd;
      } else {
        // User -> User transfer, default to positive flow
        netDelta = tx.valueUsd;
      }

      // Time windows
      if (ageMs <= ONE_HOUR) {
        netFlow1hUsd += netDelta;
      }
      if (ageMs <= FOUR_HOURS) {
        netFlow4hUsd += netDelta;
      }
      if (ageMs <= TWENTY_FOUR_HOURS) {
        netFlow24hUsd += netDelta;
        if (netDelta > 0n) {
          inflow24hUsd += netDelta;
        } else {
          outflow24hUsd += -netDelta;
        }

        // Platform breakdown
        if (tx.platform === "ONDO") {
          ondoNetFlowUsd += netDelta;
        } else if (tx.platform === "BSTOCKS") {
          bStocksNetFlowUsd += netDelta;
        } else if (tx.platform === "XSTOCKS") {
          xStocksNetFlowUsd += netDelta;
        }
      }

      // Wallet tracking: track recipient if not pool, and sender if not pool
      const trackedWallet = isFromPool ? tx.to : isToPool ? tx.from : tx.to;
      const walletLower = trackedWallet.toLowerCase();

      const existing = walletMap.get(walletLower) || {
        inflow: 0n,
        outflow: 0n,
        txCount: 0,
        lastActive: tx.timestamp,
      };

      if (netDelta > 0n) {
        existing.inflow += tx.valueUsd;
      } else {
        existing.outflow += tx.valueUsd;
      }
      existing.txCount += 1;
      if (tx.timestamp.getTime() > existing.lastActive.getTime()) {
        existing.lastActive = tx.timestamp;
      }
      walletMap.set(walletLower, existing);

      // Check whale transaction
      if (tx.valueUsd >= this.whaleThresholdUsd) {
        const direction = netDelta >= 0n ? "INFLOW" : "OUTFLOW";
        whaleAlerts.push({
          id: `whale:${tx.hash}:${tx.ticker}`,
          hash: tx.hash,
          timestamp: tx.timestamp,
          ticker: tx.ticker,
          platform: tx.platform,
          wallet: trackedWallet,
          walletLabel: this.formatWalletLabel(trackedWallet),
          direction,
          amountTokens: tx.valueTokens,
          amountUsd: tx.valueUsd,
        });
      }

      // Pre-event positioning check: accumulation while TradFi market status is CLOSED
      if (currentMarketStatus === "CLOSED" && netDelta > 0n && ageMs <= FOUR_HOURS) {
        hasPreEventActivity = true;
      }
    }

    // Rank top wallets by absolute net flow
    const topWallets: WalletFlowSummary[] = Array.from(walletMap.entries())
      .map(([address, data]) => {
        const netFlowUsd = data.inflow - data.outflow;
        // Approximation of holdings from observed inflows net of outflows
        const holdingUsd = netFlowUsd > 0n ? netFlowUsd : 0n;
        return {
          address,
          label: this.formatWalletLabel(address),
          ticker: upper,
          inflowUsd: data.inflow,
          outflowUsd: data.outflow,
          netFlowUsd,
          holdingUsd,
          txCount: data.txCount,
          lastActive: data.lastActive,
        };
      })
      .sort((a, b) => {
        const absA = a.netFlowUsd < 0n ? -a.netFlowUsd : a.netFlowUsd;
        const absB = b.netFlowUsd < 0n ? -b.netFlowUsd : b.netFlowUsd;
        return absA > absB ? -1 : absA < absB ? 1 : 0;
      })
      .slice(0, this.topWalletsLimit);

    // Dominant platform determination
    const platforms: { platform: Platform; net: bigint }[] = [
      { platform: "ONDO", net: ondoNetFlowUsd },
      { platform: "BSTOCKS", net: bStocksNetFlowUsd },
      { platform: "XSTOCKS", net: xStocksNetFlowUsd },
    ];
    platforms.sort((a, b) => (a.net > b.net ? -1 : a.net < b.net ? 1 : 0));
    const dominantPlatform = platforms[0]?.platform ?? "ONDO";

    return {
      ticker: upper,
      netFlow1hUsd,
      netFlow4hUsd,
      netFlow24hUsd,
      inflow24hUsd,
      outflow24hUsd,
      topWallets,
      whaleAlerts,
      preEventPositioning: hasPreEventActivity,
      crossPlatform: {
        ticker: upper,
        ondoNetFlowUsd,
        bStocksNetFlowUsd,
        xStocksNetFlowUsd,
        totalNetFlowUsd: netFlow24hUsd,
        dominantPlatform,
      },
    };
  }

  /**
   * Generate hourly net flow time series for chart visualization.
   */
  async getTimeSeries(ticker: string, hours = 24): Promise<FlowTimeSeriesPoint[]> {
    const upper = ticker.toUpperCase();
    const transfers = await this.provider.getTokenTransfers({ ticker: upper });
    const nowMs = Date.now();
    const ONE_HOUR = 3600 * 1000;

    const buckets = new Map<number, { inflow: bigint; outflow: bigint }>();

    // Initialize buckets
    for (let i = hours - 1; i >= 0; i--) {
      buckets.set(i, { inflow: 0n, outflow: 0n });
    }

    for (const tx of transfers) {
      const ageHours = Math.floor((nowMs - tx.timestamp.getTime()) / ONE_HOUR);
      if (ageHours >= 0 && ageHours < hours) {
        const bucket = buckets.get(ageHours);
        if (bucket) {
          const isToPool = KNOWN_POOLS.has(tx.to.toLowerCase());
          if (isToPool) {
            bucket.outflow += tx.valueUsd;
          } else {
            bucket.inflow += tx.valueUsd;
          }
        }
      }
    }

    const points: FlowTimeSeriesPoint[] = [];
    for (let i = hours - 1; i >= 0; i--) {
      const bucket = buckets.get(i) ?? { inflow: 0n, outflow: 0n };
      const pointTime = new Date(nowMs - i * ONE_HOUR);
      points.push({
        timestamp: pointTime.toISOString(),
        inflowUsd: bucket.inflow,
        outflowUsd: bucket.outflow,
        netFlowUsd: bucket.inflow - bucket.outflow,
      });
    }

    return points;
  }

  /**
   * Get high-level market dashboard overview across all tracked tickers.
   */
  async getMarketDashboardSummary(tickers: string[]): Promise<FlowDashboardSummary> {
    let totalMarketNetFlow24hUsd = 0n;
    const summaries: TickerFlowSummary[] = [];

    for (const ticker of tickers) {
      const summary = await this.aggregateTickerFlow(ticker);
      summaries.push(summary);
      totalMarketNetFlow24hUsd += summary.netFlow24hUsd;
    }

    const topAccumulated = summaries
      .filter((s) => s.netFlow24hUsd > 0n)
      .sort((a, b) => (a.netFlow24hUsd > b.netFlow24hUsd ? -1 : 1))
      .map((s) => ({
        ticker: s.ticker,
        netFlow24hUsd: s.netFlow24hUsd,
        dominantPlatform: s.crossPlatform.dominantPlatform,
      }));

    const topDistributed = summaries
      .filter((s) => s.netFlow24hUsd < 0n)
      .sort((a, b) => (a.netFlow24hUsd < b.netFlow24hUsd ? -1 : 1))
      .map((s) => ({
        ticker: s.ticker,
        netFlow24hUsd: s.netFlow24hUsd,
        dominantPlatform: s.crossPlatform.dominantPlatform,
      }));

    const recentWhaleAlerts = summaries
      .flatMap((s) => s.whaleAlerts)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 15);

    return {
      totalMarketNetFlow24hUsd,
      topAccumulated,
      topDistributed,
      recentWhaleAlerts,
      lastUpdated: new Date(),
      isStale: false,
    };
  }

  /**
   * Get cross-platform comparison for a single ticker.
   */
  async getCrossPlatformSummary(ticker: string): Promise<CrossPlatformFlowSummary> {
    const summary = await this.aggregateTickerFlow(ticker);
    return summary.crossPlatform;
  }

  /**
   * Get whale alerts across one or all tickers.
   */
  async getWhaleAlerts(ticker?: string, limit = 10): Promise<WhaleAlert[]> {
    const transfers = await this.provider.getTokenTransfers({ ticker });
    const alerts: WhaleAlert[] = [];

    for (const tx of transfers) {
      if (tx.valueUsd >= this.whaleThresholdUsd) {
        const isToPool = KNOWN_POOLS.has(tx.to.toLowerCase());
        const wallet = isToPool ? tx.from : tx.to;
        alerts.push({
          id: `whale:${tx.hash}:${tx.ticker}`,
          hash: tx.hash,
          timestamp: tx.timestamp,
          ticker: tx.ticker,
          platform: tx.platform,
          wallet,
          walletLabel: this.formatWalletLabel(wallet),
          direction: isToPool ? "OUTFLOW" : "INFLOW",
          amountTokens: tx.valueTokens,
          amountUsd: tx.valueUsd,
        });
      }
    }

    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return alerts.slice(0, limit);
  }

  private formatWalletLabel(address: string): string {
    if (address.length < 10) return address;
    return `Whale ${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
