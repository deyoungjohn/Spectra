// packages/core/src/strategy/validator.ts
//
// Strategy DSL validator and policy compliance checker.
// Reference: Spectra.md §7.2, §7.3, §5.4

import type { StrategyDSL, ConditionBlock, ActionBlock, StrategyTrigger } from "../types/strategy.js";
import type { ExecutionPolicy } from "../types/policy.js";
import type { StrategyValidationResult } from "./types.js";

const VALID_PLATFORMS = new Set(["ONDO", "BSTOCKS", "XSTOCKS"]);

export class StrategyValidator {
  /**
   * Validate a StrategyDSL for syntactical correctness and policy compliance.
   */
  static validate(
    strategy: StrategyDSL,
    policy?: ExecutionPolicy,
  ): StrategyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const policyViolations: string[] = [];

    // 1. Validate Strategy Name
    if (!strategy.name || strategy.name.trim() === "") {
      errors.push("Strategy name is required and cannot be empty.");
    }

    // 2. Validate Action
    if (!strategy.action) {
      errors.push("Strategy action block is required.");
    } else {
      StrategyValidator.validateAction(strategy.action, errors, warnings);
    }

    // 3. Validate Trigger
    if (!strategy.trigger) {
      errors.push("Strategy trigger block is required.");
    } else {
      StrategyValidator.validateTrigger(strategy.trigger, errors);
    }

    // 4. Validate Policy compliance
    if (policy && strategy.action) {
      if (policy.killSwitch) {
        policyViolations.push("User account kill switch is currently active.");
      }

      if ("amountUsd" in strategy.action) {
        if (strategy.action.amountUsd > policy.maxTradeNotionalUsd) {
          policyViolations.push(
            `Trade amount of ${strategy.action.amountUsd.toString()} exceeds policy max notional of ${policy.maxTradeNotionalUsd.toString()}.`,
          );
        }
      }

      if (strategy.policy?.maxSlippageBps && strategy.policy.maxSlippageBps > policy.maxSlippageBps) {
        policyViolations.push(
          `Requested slippage cap of ${strategy.policy.maxSlippageBps.toString()} bps exceeds policy limit of ${policy.maxSlippageBps.toString()} bps.`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      policyCompliant: policyViolations.length === 0,
      policyViolations,
    };
  }

  private static validateAction(action: ActionBlock, errors: string[], warnings: string[]) {
    switch (action.type) {
      case "BUY":
      case "SELL":
        if (!action.ticker || action.ticker.trim() === "") {
          errors.push(`Action ${action.type} requires a valid ticker.`);
        }
        if (!VALID_PLATFORMS.has(action.platform)) {
          errors.push(`Invalid platform "${action.platform}". Allowed: ONDO, BSTOCKS, XSTOCKS.`);
        }
        if (action.amountUsd <= 0n) {
          errors.push(`Action ${action.type} amountUsd must be greater than zero.`);
        }
        break;

      case "ROTATE":
        if (!action.ticker || action.ticker.trim() === "") {
          errors.push("Action ROTATE requires a valid ticker.");
        }
        if (!VALID_PLATFORMS.has(action.fromPlatform) || !VALID_PLATFORMS.has(action.toPlatform)) {
          errors.push("Action ROTATE requires valid fromPlatform and toPlatform.");
        }
        if (action.fromPlatform === action.toPlatform) {
          errors.push("Action ROTATE source and destination platforms must be different.");
        }
        break;

      case "ALERT":
        if (!action.channel || !["telegram", "dashboard"].includes(action.channel)) {
          errors.push("Action ALERT requires channel 'telegram' or 'dashboard'.");
        }
        if (!action.message || action.message.trim() === "") {
          warnings.push("Alert message is blank.");
        }
        break;

      case "PAUSE":
        if (action.durationHours <= 0) {
          errors.push("Action PAUSE requires durationHours > 0.");
        }
        break;

      case "REBALANCE":
        if (!action.targetAllocations || Object.keys(action.targetAllocations).length === 0) {
          errors.push("Action REBALANCE requires target allocations.");
        }
        break;

      case "KILL_SWITCH":
        // Valid
        break;

      default:
        errors.push(`Unrecognized action block type: ${(action as { type: string }).type}`);
    }
  }

  private static validateTrigger(trigger: StrategyTrigger, errors: string[]) {
    if ("conditions" in trigger) {
      if (!Array.isArray(trigger.conditions) || trigger.conditions.length === 0) {
        errors.push(`Composite trigger ${trigger.type} must contain at least one condition.`);
      } else {
        for (const cond of trigger.conditions) {
          StrategyValidator.validateCondition(cond, errors);
        }
      }
    } else {
      StrategyValidator.validateCondition(trigger, errors);
    }
  }

  private static validateCondition(cond: ConditionBlock, errors: string[]) {
    switch (cond.type) {
      case "PRICE_ABOVE":
      case "PRICE_BELOW":
        if (!cond.ticker) errors.push(`${cond.type} requires a ticker.`);
        if (cond.price <= 0n) errors.push(`${cond.type} price must be positive.`);
        break;

      case "ORACLE_DIVERGENCE_ABOVE":
        if (!cond.ticker) errors.push("ORACLE_DIVERGENCE_ABOVE requires a ticker.");
        if (cond.divergenceBps <= 0n) errors.push("Divergence bps threshold must be positive.");
        break;

      case "WEEKEND_PREMIUM_ABOVE":
        if (!cond.ticker) errors.push("WEEKEND_PREMIUM_ABOVE requires a ticker.");
        if (cond.premiumBps <= 0n) errors.push("Weekend premium bps threshold must be positive.");
        break;

      case "CROSS_PLATFORM_BASIS_ABOVE":
        if (!cond.ticker) errors.push("CROSS_PLATFORM_BASIS_ABOVE requires a ticker.");
        if (cond.basisBps <= 0n) errors.push("Basis bps threshold must be positive.");
        break;

      case "FLOW_ACCUMULATION_ABOVE":
        if (!cond.ticker) errors.push("FLOW_ACCUMULATION_ABOVE requires a ticker.");
        if (cond.usdAmount <= 0n) errors.push("Flow accumulation amount must be positive.");
        break;

      case "TIME_SCHEDULE":
        if (!cond.cron || cond.cron.trim().split(/\s+/).length < 5) {
          errors.push("TIME_SCHEDULE requires a valid 5-part cron expression (e.g. '0 13 * * 1').");
        }
        break;

      case "RATIO_DRIFT_DETECTED":
        if (!cond.ticker) errors.push("RATIO_DRIFT_DETECTED requires a ticker.");
        break;

      case "MARKET_OPENS":
      case "MARKET_CLOSES":
        // Valid
        break;

      case "VOLATILITY_ABOVE":
        if (!cond.ticker) errors.push("VOLATILITY_ABOVE requires a ticker.");
        break;

      default:
        errors.push(`Unrecognized condition block type: ${(cond as { type: string }).type}`);
    }
  }
}
