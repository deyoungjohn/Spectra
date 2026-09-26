// packages/core/src/types/policy.ts
//
// Execution policy types for the Policy Engine.
// Reference: Spectra.md §5.4

/**
 * Execution constraints enforced by the Policy Engine.
 * Backed by PolicyVault.sol on-chain.
 */
export interface ExecutionPolicy {
  /** User identifier (wallet address) */
  userId: string;

  /** Maximum trade size in USD (smallest unit, 18-decimal) */
  maxTradeNotionalUsd: bigint;

  /** Maximum allowed slippage in basis points */
  maxSlippageBps: bigint;

  /** Cooldown between trades in seconds */
  cooldownSeconds: number;

  /** Daily spending limit in USD (smallest unit, 18-decimal) */
  dailyLimitUsd: bigint;

  /** Token addresses the user is allowed to trade */
  allowedTokens: string[];

  /** Emergency stop — blocks all execution */
  killSwitch: boolean;
}

/**
 * Result of a policy check.
 */
export interface PolicyCheckResult {
  /** Whether the trade is allowed */
  allowed: boolean;

  /** Reason code if rejected */
  reasonCode: PolicyReasonCode | null;

  /** Human-readable explanation */
  message: string;
}

/**
 * Reason codes for policy rejections.
 * Reference: Spectra.md §5.9
 */
export type PolicyReasonCode =
  | "KILL_SWITCH"
  | "POLICY_LIMIT"
  | "HALT_SIGNAL_ACTIVE"
  | "INSUFFICIENT_CASH"
  | "COOLDOWN_ACTIVE"
  | "CONFLICTING_DIRECTION"
  | "LIQUIDITY_INSUFFICIENT"
  | "MAX_TRADE_EXCEEDED"
  | "MAX_SLIPPAGE_EXCEEDED"
  | "DAILY_LIMIT_EXCEEDED";
