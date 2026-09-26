// packages/core/src/policy/engine.ts
//
// Policy Engine: Enforces execution constraints for agent actions.
// Mirrors on-chain PolicyVault.sol logic with kill switch, slippage caps,
// cooldowns, and daily limits.
// Reference: Spectra.md §5.4, §5.9, §10.3

import type {
  ExecutionPolicy,
  PolicyCheckResult,
} from "../types/policy.js";
import type { SignalEngine } from "../signals/engine.js";

export interface TradeProposal {
  ticker: string;
  tokenAddress: string;
  direction: "BUY" | "SELL";
  amountUsd: bigint; // 18-dec fixed point
  expectedSlippageBps: bigint;
  timestamp?: number;
}

export interface UserPolicyState {
  currentDailyUsageUsd: bigint;
  lastTradeTimestamp: number;
  lastDayResetTimestamp: number;
}

export class PolicyEngine {
  private userStates: Map<string, UserPolicyState> = new Map();
  private signalEngine?: SignalEngine;

  constructor(signalEngine?: SignalEngine) {
    this.signalEngine = signalEngine;
  }

  /**
   * Get or initialize the user's execution tracking state.
   */
  getUserState(userId: string): UserPolicyState {
    const existing = this.userStates.get(userId.toLowerCase());
    if (existing) return existing;

    const initial: UserPolicyState = {
      currentDailyUsageUsd: 0n,
      lastTradeTimestamp: 0,
      lastDayResetTimestamp: 0,
    };
    this.userStates.set(userId.toLowerCase(), initial);
    return initial;
  }

  /**
   * Validate a trade proposal against policy constraints.
   */
  checkTrade(
    policy: ExecutionPolicy,
    trade: TradeProposal,
    currentTimeMs: number = Date.now(),
  ): PolicyCheckResult {
    const userId = policy.userId.toLowerCase();
    const state = this.getUserState(userId);

    // 1. Kill Switch Check
    if (policy.killSwitch) {
      return {
        allowed: false,
        reasonCode: "KILL_SWITCH",
        message: "Execution blocked: Kill switch is active.",
      };
    }

    // 2. Active Halt Signal Check (§5.3 Signal A, §5.9)
    if (this.signalEngine && this.signalEngine.hasActiveHalt(trade.ticker)) {
      return {
        allowed: false,
        reasonCode: "HALT_SIGNAL_ACTIVE",
        message: `Execution blocked: Active critical halt signal on ${trade.ticker}.`,
      };
    }

    // 3. Max Trade Notional Check
    if (policy.maxTradeNotionalUsd > 0n && trade.amountUsd > policy.maxTradeNotionalUsd) {
      return {
        allowed: false,
        reasonCode: "MAX_TRADE_EXCEEDED",
        message: `Trade amount exceeds max notional limit of ${policy.maxTradeNotionalUsd.toString()}.`,
      };
    }

    // 4. Max Slippage Check
    if (policy.maxSlippageBps > 0n && trade.expectedSlippageBps > policy.maxSlippageBps) {
      return {
        allowed: false,
        reasonCode: "MAX_SLIPPAGE_EXCEEDED",
        message: `Expected slippage ${trade.expectedSlippageBps.toString()} bps exceeds limit ${policy.maxSlippageBps.toString()} bps.`,
      };
    }

    // 5. Cooldown Check
    if (policy.cooldownSeconds > 0 && state.lastTradeTimestamp > 0) {
      const cooldownMs = policy.cooldownSeconds * 1000;
      const elapsed = currentTimeMs - state.lastTradeTimestamp;
      if (elapsed < cooldownMs) {
        return {
          allowed: false,
          reasonCode: "COOLDOWN_ACTIVE",
          message: `Cooldown active: ${Math.ceil((cooldownMs - elapsed) / 1000)}s remaining.`,
        };
      }
    }

    // 6. Daily Spending Limit Check (with rolling 24h reset)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (state.lastDayResetTimestamp > 0 && currentTimeMs - state.lastDayResetTimestamp >= ONE_DAY_MS) {
      // 24h elapsed, reset daily usage
      state.currentDailyUsageUsd = 0n;
      state.lastDayResetTimestamp = currentTimeMs;
    }

    if (
      policy.dailyLimitUsd > 0n &&
      state.currentDailyUsageUsd + trade.amountUsd > policy.dailyLimitUsd
    ) {
      return {
        allowed: false,
        reasonCode: "DAILY_LIMIT_EXCEEDED",
        message: `Daily limit exceeded: Requested trade exceeds remaining allowance.`,
      };
    }

    // 7. Allowed Tokens Allowlists Check
    if (policy.allowedTokens.length > 0) {
      const normalizedAllowed = policy.allowedTokens.map((t) => t.toLowerCase());
      if (!normalizedAllowed.includes(trade.tokenAddress.toLowerCase())) {
        return {
          allowed: false,
          reasonCode: "POLICY_LIMIT",
          message: `Token ${trade.tokenAddress} is not in the user's allowed tokens whitelist.`,
        };
      }
    }

    return {
      allowed: true,
      reasonCode: null,
      message: "Trade passes all policy checks.",
    };
  }

  /**
   * Commit a trade execution into the user's state after verification and execution.
   */
  recordTradeExecution(
    userId: string,
    amountUsd: bigint,
    executionTimeMs: number = Date.now(),
  ) {
    const state = this.getUserState(userId);
    if (state.lastDayResetTimestamp === 0) {
      state.lastDayResetTimestamp = executionTimeMs;
    }
    state.currentDailyUsageUsd += amountUsd;
    state.lastTradeTimestamp = executionTimeMs;
  }
}
