// packages/core/src/strategy/types.ts
//
// Strategy Forge types and simulation interfaces.
// Reference: Spectra.md §7.2, §7.3, §7.7

import type { StrategyDSL, ActionBlock } from "../types/strategy.js";
import type { ExecutionPolicy } from "../types/policy.js";
import type { Platform } from "../types/platform.js";

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: "DCA" | "ARBITRAGE" | "GUARD" | "TACTICAL";
  dsl: StrategyDSL;
  defaultTicker: string;
  estimatedApyBps?: number;
}

export interface StrategyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  policyCompliant: boolean;
  policyViolations: string[];
}

export interface SimulationResult {
  strategyName: string;
  triggered: boolean;
  triggerReason: string;
  action: ActionBlock;
  simulatedPriceUsd: bigint; // 18-dec fixed-point
  estimatedSlippageBps: bigint;
  estimatedFeeUsd: bigint; // 18-dec fixed-point
  netAmountOutUsd: bigint; // 18-dec fixed-point
  simulationHash: string; // SHA-256 hash matching ReceiptService (§5.5)
  timestamp: Date;
  status: "SUCCESS" | "BLOCKED_BY_POLICY" | "NOT_TRIGGERED";
  policyCheckPassed: boolean;
}

export interface DeployedStrategy {
  id: string;
  name: string;
  dsl: StrategyDSL;
  userId: string;
  status: "ACTIVE" | "PAUSED" | "HALTED" | "TERMINATED";
  createdAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
  totalVolumeUsd: bigint;
  policy: ExecutionPolicy;
  agentIdentity?: string; // ERC-8004 identity if registered (§9.1)
}

export interface StrategyExecutionRecord {
  id: string;
  strategyId: string;
  strategyName: string;
  timestamp: Date;
  actionType: string;
  ticker: string;
  platform?: Platform;
  amountUsd: bigint;
  receiptHash: string;
  status: "CONFIRMED" | "REVERTED" | "SIMULATED";
  txHash?: string;
}
