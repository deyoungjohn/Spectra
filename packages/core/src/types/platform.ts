// packages/core/src/types/platform.ts
//
// Shared enums and types for platforms and market status.
// Reference: Spectra.md §5.2, §6

/** Supported tokenized equity platforms on BSC */
export type Platform = "ONDO" | "BSTOCKS" | "XSTOCKS";

/** Market session status */
export type MarketStatus = "OPEN" | "CLOSED" | "HALTED" | "PRE_MARKET" | "AFTER_HOURS";

/** Signal severity levels */
export type SignalSeverity = "info" | "warning" | "critical";

/** Signal types from Spectra.md §5.3 */
export type SignalType =
  | "ORACLE_DIVERGENCE"
  | "WEEKEND_PREMIUM"
  | "BASIS"
  | "FLOW"
  | "LIQUIDITY"
  | "RATIO_DRIFT";

/** Market regime determines which signals are active */
export type MarketRegime = "OPEN" | "CLOSED" | "ANY";
