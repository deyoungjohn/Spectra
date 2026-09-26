// packages/core/src/types/signal.ts
//
// AlphaSignal interface and related types for the Signal Engine.
// Reference: Spectra.md §5.3

import type { SignalType, SignalSeverity, MarketRegime } from "./platform.js";

/**
 * An actionable signal emitted by the Signal Engine.
 */
export interface AlphaSignal {
  /** Unique identifier for this signal instance */
  id: string;

  /** Which signal type this is */
  type: SignalType;

  /** Which ticker this applies to */
  ticker: string;

  /** How urgent is this signal */
  severity: SignalSeverity;

  /** The computed value (bps, USD amount, or boolean-as-1/0) */
  value: bigint;

  /** Additional context about the signal */
  context: Record<string, unknown>;

  /** When the signal was generated */
  timestamp: Date;

  /** Whether this signal should trigger automated actions */
  actionable: boolean;

  /** Which market regime this signal applies to */
  regime: MarketRegime;
}

/**
 * Signal thresholds from Spectra.md §5.3.
 */
export interface SignalThresholds {
  /** Oracle Divergence: alert threshold in bps */
  oracleDivergenceAlertBps: bigint;

  /** Oracle Divergence: halt threshold in bps */
  oracleDivergenceHaltBps: bigint;

  /** Weekend Premium: threshold in bps */
  weekendPremiumBps: bigint;

  /** Cross-Platform Basis: threshold in bps */
  crossPlatformBasisBps: bigint;

  /** Flow Accumulation: threshold in USD */
  flowAccumulationUsd: bigint;

  /** Liquidity Alert: depth threshold in USD */
  liquidityDepthUsd: bigint;
}

/** Default thresholds from Spectra.md §5.3 */
export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholds = {
  oracleDivergenceAlertBps: 10n,
  oracleDivergenceHaltBps: 25n,
  weekendPremiumBps: 100n,
  crossPlatformBasisBps: 20n,
  flowAccumulationUsd: 5_000n * (10n ** 18n),
  liquidityDepthUsd: 1_000n * (10n ** 18n),
};
