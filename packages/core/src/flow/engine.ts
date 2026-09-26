// packages/core/src/flow/engine.ts
//
// Flow Signal Engine for Module 3: Flow Radar.
// Evaluates FLOW_ACCUMULATION, FLOW_DISTRIBUTION, and WHALE_MOVEMENT.
// Emits signals into the Base Layer Signal Engine.
// Reference: Spectra.md §5.3, §8.2

import type { AlphaSignal, SignalSeverity } from "../types/index.js";
import type { SignalEngine } from "../signals/engine.js";
import type { FeatureFlags } from "../config/features.js";
import { DEFAULT_FEATURES } from "../config/features.js";
import { parseToFixed18 } from "../normalize/fixed-point.js";
import type { FlowAggregator } from "./aggregator.js";
import type { FlowSignalDetail } from "./types.js";

export interface FlowSignalEngineConfig {
  accumulationThresholdUsd?: bigint; // Default: $5,000 net (Spectra.md §5.3)
  distributionThresholdUsd?: bigint; // Default: -$5,000 net
  whaleThresholdUsd?: bigint; // Default: $10,000
}

export class FlowSignalEngine {
  private aggregator: FlowAggregator;
  private signalEngine?: SignalEngine;
  private features: FeatureFlags;
  private accumulationThresholdUsd: bigint;
  private distributionThresholdUsd: bigint;
  private whaleThresholdUsd: bigint;

  constructor(
    aggregator: FlowAggregator,
    options?: {
      signalEngine?: SignalEngine;
      features?: Partial<FeatureFlags>;
      config?: FlowSignalEngineConfig;
    },
  ) {
    this.aggregator = aggregator;
    this.signalEngine = options?.signalEngine;
    this.features = {
      ...DEFAULT_FEATURES,
      ...options?.features,
    };
    this.accumulationThresholdUsd =
      options?.config?.accumulationThresholdUsd ?? parseToFixed18("5000");
    this.distributionThresholdUsd =
      options?.config?.distributionThresholdUsd ?? -parseToFixed18("5000");
    this.whaleThresholdUsd =
      options?.config?.whaleThresholdUsd ?? parseToFixed18("10000");
  }

  /**
   * Evaluate flow signals for a single ticker over the 4-hour window.
   */
  async evaluateTicker(ticker: string): Promise<FlowSignalDetail[]> {
    // Graceful degradation when Module 3 is disabled
    if (!this.features.MODULE_3_FLOW_RADAR) {
      return [];
    }

    const upper = ticker.toUpperCase();
    const summary = await this.aggregator.aggregateTickerFlow(upper);
    const details: FlowSignalDetail[] = [];
    const now = new Date();

    // 1. Check FLOW_ACCUMULATION (> $5,000 net over 4h)
    if (summary.netFlow4hUsd >= this.accumulationThresholdUsd) {
      const severity: SignalSeverity =
        summary.netFlow4hUsd >= parseToFixed18("25000") ? "warning" : "info";

      const signal: AlphaSignal = {
        id: `sig:flow_accum:${upper}:${now.getTime()}`,
        type: "FLOW",
        ticker: upper,
        severity,
        value: summary.netFlow4hUsd,
        context: {
          category: "FLOW_ACCUMULATION",
          netFlow4hUsd: summary.netFlow4hUsd.toString(),
          netFlow24hUsd: summary.netFlow24hUsd.toString(),
          dominantPlatform: summary.crossPlatform.dominantPlatform,
          topWallet: summary.topWallets[0]?.address,
          preEventPositioning: summary.preEventPositioning,
        },
        timestamp: now,
        actionable: true,
        regime: "ANY",
      };

      details.push({
        signal,
        category: "FLOW_ACCUMULATION",
        netFlow4hUsd: summary.netFlow4hUsd,
        thresholdUsd: this.accumulationThresholdUsd,
      });

      // Update Base Layer SignalEngine
      if (this.signalEngine) {
        this.signalEngine.recordFlow(upper, summary.netFlow4hUsd);
      }
    }

    // 2. Check FLOW_DISTRIBUTION (< -$5,000 net over 4h)
    if (summary.netFlow4hUsd <= this.distributionThresholdUsd) {
      const severity: SignalSeverity =
        summary.netFlow4hUsd <= -parseToFixed18("25000") ? "warning" : "info";

      const signal: AlphaSignal = {
        id: `sig:flow_dist:${upper}:${now.getTime()}`,
        type: "FLOW",
        ticker: upper,
        severity,
        value: summary.netFlow4hUsd,
        context: {
          category: "FLOW_DISTRIBUTION",
          netFlow4hUsd: summary.netFlow4hUsd.toString(),
          netFlow24hUsd: summary.netFlow24hUsd.toString(),
          topSeller: summary.topWallets[0]?.address,
        },
        timestamp: now,
        actionable: true,
        regime: "ANY",
      };

      details.push({
        signal,
        category: "FLOW_DISTRIBUTION",
        netFlow4hUsd: summary.netFlow4hUsd,
        thresholdUsd: this.distributionThresholdUsd,
      });

      if (this.signalEngine) {
        this.signalEngine.recordFlow(upper, summary.netFlow4hUsd);
      }
    }

    // 3. Check WHALE_MOVEMENT (recent whale alerts in 4h window)
    for (const alert of summary.whaleAlerts) {
      const alertAgeMs = now.getTime() - alert.timestamp.getTime();
      if (alertAgeMs <= 4 * 3600 * 1000) {
        const severity: SignalSeverity =
          alert.amountUsd >= parseToFixed18("50000") ? "warning" : "info";

        const signal: AlphaSignal = {
          id: `sig:whale:${upper}:${alert.hash.slice(0, 10)}`,
          type: "FLOW",
          ticker: upper,
          severity,
          value: alert.amountUsd,
          context: {
            category: "WHALE_MOVEMENT",
            direction: alert.direction,
            wallet: alert.wallet,
            walletLabel: alert.walletLabel,
            amountUsd: alert.amountUsd.toString(),
            hash: alert.hash,
          },
          timestamp: alert.timestamp,
          actionable: true,
          regime: "ANY",
        };

        details.push({
          signal,
          category: "WHALE_MOVEMENT",
          netFlow4hUsd: summary.netFlow4hUsd,
          thresholdUsd: this.whaleThresholdUsd,
          whaleAddress: alert.wallet,
        });
      }
    }

    return details;
  }

  /**
   * Evaluate flow signals across all tracked tickers.
   */
  async evaluateAll(tickers: string[]): Promise<FlowSignalDetail[]> {
    if (!this.features.MODULE_3_FLOW_RADAR) {
      return [];
    }

    const allSignals: FlowSignalDetail[] = [];
    for (const ticker of tickers) {
      const signals = await this.evaluateTicker(ticker);
      allSignals.push(...signals);
    }
    return allSignals;
  }
}
