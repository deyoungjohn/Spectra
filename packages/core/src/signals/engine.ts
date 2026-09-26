// packages/core/src/signals/engine.ts
//
// Signal Engine: Evaluates normalized stock data and emits actionable AlphaSignals.
// Implements Signals A–F with regime awareness and feature flag gating.
// Reference: Spectra.md §2.3, §2.4, §5.3, §5.10

import type { NormalizedStock } from "../types/normalized-stock.js";
import type { AlphaSignal, SignalThresholds } from "../types/signal.js";
import { DEFAULT_SIGNAL_THRESHOLDS } from "../types/signal.js";
import type { FeatureFlags } from "../config/features.js";
import { DEFAULT_FEATURES } from "../config/features.js";
import type { RatioDriftEvent } from "../normalize/engine.js";

export interface SignalEngineOptions {
  thresholds?: Partial<SignalThresholds>;
  features?: Partial<FeatureFlags>;
}

export class SignalEngine {
  private thresholds: SignalThresholds;
  private features: FeatureFlags;
  private activeSignals: Map<string, AlphaSignal> = new Map();
  private flowAccumulations: Map<string, bigint> = new Map(); // Trailing 4h net flow
  private listeners: Array<(signal: AlphaSignal) => void> = [];

  constructor(options?: SignalEngineOptions) {
    this.thresholds = {
      ...DEFAULT_SIGNAL_THRESHOLDS,
      ...options?.thresholds,
    };
    this.features = {
      ...DEFAULT_FEATURES,
      ...options?.features,
    };
  }

  /**
   * Subscribe to new signals emitted by the engine (§5.7).
   */
  public onSignal(listener: (signal: AlphaSignal) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  private emitSignal(signal: AlphaSignal) {
    for (const listener of this.listeners) {
      try {
        listener(signal);
      } catch {
        // Safe dispatch
      }
    }
  }

  /**
   * Update feature flags at runtime (e.g. after weekend empirical test).
   */
  updateFeatures(features: Partial<FeatureFlags>) {
    this.features = { ...this.features, ...features };
  }

  /**
   * Record flow accumulation from Flow Radar (Module 3) or external feed.
   */
  recordFlow(ticker: string, netFlowUsd: bigint) {
    this.flowAccumulations.set(ticker.toUpperCase(), netFlowUsd);
  }

  /**
   * Handle ratio drift detected by NormalizationEngine.
   */
  handleRatioDrift(event: RatioDriftEvent): AlphaSignal {
    const id = `sig:ratio_drift:${event.ticker}:${Date.now()}`;
    const signal: AlphaSignal = {
      id,
      type: "RATIO_DRIFT",
      ticker: event.ticker,
      severity: "warning",
      value: event.newRatio - event.oldRatio,
      context: {
        platform: event.platform,
        oldRatio: event.oldRatio.toString(),
        newRatio: event.newRatio.toString(),
      },
      timestamp: event.timestamp,
      actionable: true,
      regime: "ANY",
    };

    this.activeSignals.set(`${event.ticker}:RATIO_DRIFT`, signal);
    this.emitSignal(signal);
    return signal;
  }

  /**
   * Evaluate all active signals for a given normalized stock.
   */
  evaluateStock(stock: NormalizedStock): AlphaSignal[] {
    const signals: AlphaSignal[] = [];
    const ticker = stock.ticker.toUpperCase();

    // ── Signal A: Oracle Divergence (OPEN market only) ──
    // Formula: (perSharePrice - tradfiPrice) / tradfiPrice * 10000
    // Alert > 10 bps, Halt > 25 bps
    // If TradFi feed is down (tradfiPrice === 0n), suspend signal (§5.10)
    if (stock.marketStatus === "OPEN" && stock.tradfiPrice > 0n) {
      const absDivBps =
        stock.oracleDivergenceBps < 0n
          ? -stock.oracleDivergenceBps
          : stock.oracleDivergenceBps;

      if (absDivBps >= this.thresholds.oracleDivergenceHaltBps) {
        signals.push({
          id: `sig:oracle_div:${ticker}:${Date.now()}`,
          type: "ORACLE_DIVERGENCE",
          ticker,
          severity: "critical", // Halt threshold exceeded
          value: stock.oracleDivergenceBps,
          context: {
            perSharePrice: stock.perSharePrice.toString(),
            tradfiPrice: stock.tradfiPrice.toString(),
            divergenceBps: stock.oracleDivergenceBps.toString(),
            reason: "Halt threshold (>25 bps) exceeded",
          },
          timestamp: new Date(),
          actionable: true,
          regime: "OPEN",
        });
      } else if (absDivBps >= this.thresholds.oracleDivergenceAlertBps) {
        signals.push({
          id: `sig:oracle_div:${ticker}:${Date.now()}`,
          type: "ORACLE_DIVERGENCE",
          ticker,
          severity: "warning", // Alert threshold exceeded
          value: stock.oracleDivergenceBps,
          context: {
            perSharePrice: stock.perSharePrice.toString(),
            tradfiPrice: stock.tradfiPrice.toString(),
            divergenceBps: stock.oracleDivergenceBps.toString(),
            reason: "Alert threshold (>10 bps) exceeded",
          },
          timestamp: new Date(),
          actionable: false,
          regime: "OPEN",
        });
      }
    }

    // ── Signal B: Weekend Sentiment Premium (CLOSED market only) ──
    // LOCKED behind SIGNAL_WEEKEND_PREMIUM feature flag until empirical test (§2.4)
    if (
      this.features.SIGNAL_WEEKEND_PREMIUM &&
      stock.marketStatus === "CLOSED" &&
      stock.tradfiPrice > 0n
    ) {
      const absPremiumBps =
        stock.weekendPremiumBps < 0n
          ? -stock.weekendPremiumBps
          : stock.weekendPremiumBps;

      if (absPremiumBps >= this.thresholds.weekendPremiumBps) {
        signals.push({
          id: `sig:weekend_prem:${ticker}:${Date.now()}`,
          type: "WEEKEND_PREMIUM",
          ticker,
          severity: "info",
          value: stock.weekendPremiumBps,
          context: {
            perSharePrice: stock.perSharePrice.toString(),
            frozenTradfiClose: stock.tradfiPrice.toString(),
            premiumBps: stock.weekendPremiumBps.toString(),
          },
          timestamp: new Date(),
          actionable: true,
          regime: "CLOSED",
        });
      }
    }

    // ── Signal C: Cross-Platform Basis (ANY regime) ──
    // Threshold: > 20 bps net
    if (stock.crossPlatformBasisBps >= this.thresholds.crossPlatformBasisBps) {
      signals.push({
        id: `sig:basis:${ticker}:${Date.now()}`,
        type: "BASIS",
        ticker,
        severity: "info",
        value: stock.crossPlatformBasisBps,
        context: {
          platform: stock.platform,
          basisBps: stock.crossPlatformBasisBps.toString(),
        },
        timestamp: new Date(),
        actionable: true,
        regime: "ANY",
      });
    }

    // ── Signal D: Flow Accumulation (ANY regime) ──
    // Net accumulation > $5,000 net over trailing 4h
    const flow = this.flowAccumulations.get(ticker) ?? 0n;
    if (flow >= this.thresholds.flowAccumulationUsd) {
      signals.push({
        id: `sig:flow:${ticker}:${Date.now()}`,
        type: "FLOW",
        ticker,
        severity: "info",
        value: flow,
        context: {
          netFlowUsd: flow.toString(),
        },
        timestamp: new Date(),
        actionable: true,
        regime: "ANY",
      });
    }

    // ── Signal E: Liquidity Alert (ANY regime) ──
    // DEX depth < $1,000
    if (
      stock.dexLiquidityUsd > 0n &&
      stock.dexLiquidityUsd < this.thresholds.liquidityDepthUsd
    ) {
      signals.push({
        id: `sig:liquidity:${ticker}:${Date.now()}`,
        type: "LIQUIDITY",
        ticker,
        severity: "warning",
        value: stock.dexLiquidityUsd,
        context: {
          dexLiquidityUsd: stock.dexLiquidityUsd.toString(),
          thresholdUsd: this.thresholds.liquidityDepthUsd.toString(),
        },
        timestamp: new Date(),
        actionable: false,
        regime: "ANY",
      });
    }

    // Update active signals map
    for (const sig of signals) {
      this.activeSignals.set(`${ticker}:${sig.type}`, sig);
      this.emitSignal(sig);
    }

    return signals;
  }

  /**
   * Evaluate an entire portfolio of normalized stocks.
   */
  evaluateAll(stocks: NormalizedStock[]): AlphaSignal[] {
    const allSignals: AlphaSignal[] = [];
    for (const stock of stocks) {
      const stockSignals = this.evaluateStock(stock);
      allSignals.push(...stockSignals);
    }
    return allSignals;
  }

  /**
   * Get all currently active signals.
   */
  getActiveSignals(): AlphaSignal[] {
    return Array.from(this.activeSignals.values());
  }

  /**
   * Get active signals for a specific ticker.
   */
  getSignalsForTicker(ticker: string): AlphaSignal[] {
    const upper = ticker.toUpperCase();
    return this.getActiveSignals().filter((s) => s.ticker === upper);
  }

  /**
   * Clear or expire a signal.
   */
  clearSignal(ticker: string, type: AlphaSignal["type"]) {
    this.activeSignals.delete(`${ticker.toUpperCase()}:${type}`);
  }

  /**
   * Check if a ticker currently has an active HALT signal.
   */
  hasActiveHalt(ticker: string): boolean {
    const tickerSignals = this.getSignalsForTicker(ticker);
    return tickerSignals.some(
      (s) => s.type === "ORACLE_DIVERGENCE" && s.severity === "critical",
    );
  }
}
