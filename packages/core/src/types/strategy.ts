// packages/core/src/types/strategy.ts
//
// Strategy DSL types for the Strategy Forge (Module 2).
// Reference: Spectra.md §7.2

import type { Platform } from "./platform.js";

// ── Condition Blocks (Triggers) ──

export type ConditionBlock =
  | { type: "PRICE_ABOVE"; ticker: string; price: bigint }
  | { type: "PRICE_BELOW"; ticker: string; price: bigint }
  | { type: "ORACLE_DIVERGENCE_ABOVE"; ticker: string; divergenceBps: bigint }
  | { type: "WEEKEND_PREMIUM_ABOVE"; ticker: string; premiumBps: bigint }
  | { type: "CROSS_PLATFORM_BASIS_ABOVE"; ticker: string; basisBps: bigint }
  | { type: "FLOW_ACCUMULATION_ABOVE"; ticker: string; usdAmount: bigint }
  | { type: "RATIO_DRIFT_DETECTED"; ticker: string }
  | { type: "MARKET_OPENS" }
  | { type: "MARKET_CLOSES" }
  | { type: "TIME_SCHEDULE"; cron: string }
  | { type: "VOLATILITY_ABOVE"; ticker: string; threshold: bigint };

// ── Action Blocks (Executions) ──

export type ActionBlock =
  | { type: "BUY"; ticker: string; platform: Platform; amountUsd: bigint }
  | { type: "SELL"; ticker: string; platform: Platform; amountUsd: bigint }
  | { type: "ROTATE"; fromPlatform: Platform; toPlatform: Platform; ticker: string }
  | { type: "REBALANCE"; targetAllocations: Record<string, number> }
  | { type: "ALERT"; channel: "telegram" | "dashboard"; message: string }
  | { type: "PAUSE"; durationHours: number }
  | { type: "KILL_SWITCH" };

// ── Strategy Trigger (AND/OR composite) ──

export type StrategyTrigger =
  | ConditionBlock
  | { type: "AND"; conditions: ConditionBlock[] }
  | { type: "OR"; conditions: ConditionBlock[] };

// ── Strategy Policy ──

export interface StrategyPolicy {
  maxTradeNotionalUsd?: bigint;
  maxSlippageBps?: bigint;
  cooldownSeconds?: number;
}

// ── Complete Strategy DSL ──

export interface StrategyDSL {
  /** Human-readable name */
  name: string;

  /** Trigger condition(s) */
  trigger: StrategyTrigger;

  /** Action to execute when trigger fires */
  action: ActionBlock;

  /** Execution constraints */
  policy: StrategyPolicy;
}
