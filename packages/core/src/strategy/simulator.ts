// packages/core/src/strategy/simulator.ts
//
// Strategy Simulator for Module 2: Strategy Forge.
// Simulates strategy trigger firing and dry-run trade execution against live or mock data.
// Generates cryptographic simulationHash matching ReceiptRegistry expectations.
// Reference: Spectra.md §5.5, §7.1, §7.3

import { createHash } from "node:crypto";
import type { StrategyDSL, ConditionBlock } from "../types/strategy.js";
import type { ExecutionPolicy } from "../types/policy.js";
import { mulFixed, parseToFixed18 } from "../normalize/fixed-point.js";
import type { NormalizationEngine } from "../normalize/engine.js";
import type { FlowAggregator } from "../flow/aggregator.js";
import { StrategyValidator } from "./validator.js";
import type { SimulationResult } from "./types.js";

export class StrategySimulator {
  private normalization: NormalizationEngine;
  private flowAggregator?: FlowAggregator;

  constructor(
    normalization: NormalizationEngine,
    flowAggregator?: FlowAggregator,
  ) {
    this.normalization = normalization;
    this.flowAggregator = flowAggregator;
  }

  /**
   * Simulate execution of a StrategyDSL against current market and flow states.
   */
  async simulate(
    strategy: StrategyDSL,
    policy?: ExecutionPolicy,
  ): Promise<SimulationResult> {
    const timestamp = new Date();

    // 1. Validate strategy syntax & policy
    const validation = StrategyValidator.validate(strategy, policy);

    // 2. Resolve Ticker
    let ticker = "AAPL";
    if ("ticker" in strategy.action) {
      ticker = strategy.action.ticker;
    } else if ("ticker" in strategy.trigger) {
      ticker = strategy.trigger.ticker;
    }

    const stock = await this.normalization.getByTicker(ticker);
    const simulatedPriceUsd = stock ? stock.perSharePrice : parseToFixed18("334.60");
    const estimatedSlippageBps = stock ? stock.slippageBps : 15n;

    // 3. Evaluate Trigger Conditions
    const { triggered, reason } = await this.evaluateTrigger(strategy.trigger, ticker);

    // 4. Calculate Simulated Financials (using BigInt fixed-point)
    let tradeNotionalUsd = 0n;
    if ("amountUsd" in strategy.action) {
      tradeNotionalUsd = strategy.action.amountUsd;
    } else if (strategy.policy?.maxTradeNotionalUsd) {
      tradeNotionalUsd = strategy.policy.maxTradeNotionalUsd;
    } else {
      tradeNotionalUsd = parseToFixed18("10");
    }

    // 25 bps DEX fee (0.0025 in 18-dec = 2500000000000000n)
    const feeRate18 = 2_500_000_000_000_000n;
    const estimatedFeeUsd = mulFixed(tradeNotionalUsd, feeRate18);
    const netAmountOutUsd = tradeNotionalUsd > estimatedFeeUsd ? tradeNotionalUsd - estimatedFeeUsd : 0n;

    // 5. Generate SHA-256 Simulation Hash
    const simulationPayload = JSON.stringify(
      {
        strategyName: strategy.name,
        ticker,
        action: strategy.action,
        simulatedPriceUsd: simulatedPriceUsd.toString(),
        estimatedSlippageBps: estimatedSlippageBps.toString(),
        estimatedFeeUsd: estimatedFeeUsd.toString(),
        timestamp: timestamp.toISOString(),
      },
      (_k, v) => (typeof v === "bigint" ? v.toString() : v),
    );
    const simulationHash = createHash("sha256").update(simulationPayload).digest("hex");

    // 6. Determine final status
    let status: SimulationResult["status"] = "SUCCESS";
    if (!validation.policyCompliant) {
      status = "BLOCKED_BY_POLICY";
    } else if (!triggered) {
      status = "NOT_TRIGGERED";
    }

    return {
      strategyName: strategy.name,
      triggered,
      triggerReason: reason,
      action: strategy.action,
      simulatedPriceUsd,
      estimatedSlippageBps,
      estimatedFeeUsd,
      netAmountOutUsd,
      simulationHash,
      timestamp,
      status,
      policyCheckPassed: validation.policyCompliant,
    };
  }

  private async evaluateTrigger(
    trigger: StrategyDSL["trigger"],
    ticker: string,
  ): Promise<{ triggered: boolean; reason: string }> {
    if ("conditions" in trigger) {
      if (trigger.type === "AND") {
        for (const cond of trigger.conditions) {
          const res = await this.evaluateCondition(cond, ticker);
          if (!res.triggered) {
            return { triggered: false, reason: `Condition not met: ${res.reason}` };
          }
        }
        return { triggered: true, reason: "All AND conditions satisfied" };
      } else {
        // OR
        for (const cond of trigger.conditions) {
          const res = await this.evaluateCondition(cond, ticker);
          if (res.triggered) {
            return { triggered: true, reason: `OR condition met: ${res.reason}` };
          }
        }
        return { triggered: false, reason: "None of the OR conditions were met" };
      }
    } else {
      return this.evaluateCondition(trigger, ticker);
    }
  }

  private async evaluateCondition(
    cond: ConditionBlock,
    ticker: string,
  ): Promise<{ triggered: boolean; reason: string }> {
    const stock = await this.normalization.getByTicker(ticker);

    switch (cond.type) {
      case "CROSS_PLATFORM_BASIS_ABOVE": {
        const currentBasis = stock ? stock.crossPlatformBasisBps : 25n;
        const met = currentBasis >= cond.basisBps;
        return {
          triggered: met,
          reason: `Basis is ${currentBasis.toString()} bps (threshold: ${cond.basisBps.toString()} bps)`,
        };
      }

      case "ORACLE_DIVERGENCE_ABOVE": {
        const currentDiv = stock ? (stock.oracleDivergenceBps < 0n ? -stock.oracleDivergenceBps : stock.oracleDivergenceBps) : 0n;
        const met = currentDiv >= cond.divergenceBps;
        return {
          triggered: met,
          reason: `Oracle divergence is ${currentDiv.toString()} bps (threshold: ${cond.divergenceBps.toString()} bps)`,
        };
      }

      case "FLOW_ACCUMULATION_ABOVE": {
        let netFlow4h = parseToFixed18("6000"); // default positive mock
        if (this.flowAggregator) {
          const flowSummary = await this.flowAggregator.aggregateTickerFlow(ticker);
          netFlow4h = flowSummary.netFlow4hUsd;
        }
        const met = netFlow4h >= cond.usdAmount;
        return {
          triggered: met,
          reason: `Flow accumulation is ${netFlow4h.toString()} USD (threshold: ${cond.usdAmount.toString()} USD)`,
        };
      }

      case "PRICE_ABOVE": {
        const price = stock ? stock.perSharePrice : 0n;
        return {
          triggered: price >= cond.price,
          reason: `Price is ${price.toString()} (threshold: ${cond.price.toString()})`,
        };
      }

      case "PRICE_BELOW": {
        const price = stock ? stock.perSharePrice : 0n;
        return {
          triggered: price <= cond.price,
          reason: `Price is ${price.toString()} (threshold: ${cond.price.toString()})`,
        };
      }

      case "TIME_SCHEDULE":
      case "MARKET_OPENS":
        return {
          triggered: true,
          reason: `Simulated trigger for scheduled event ${cond.type}`,
        };

      default:
        return {
          triggered: true,
          reason: `Condition ${cond.type} assumed met in simulation`,
        };
    }
  }
}
