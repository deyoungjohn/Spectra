// packages/core/src/strategy/compiler.ts
//
// Natural Language to Strategy DSL Compiler.
// Translates natural language trading instructions into validated StrategyDSL JSON.
// Reference: Spectra.md §7.3, §7.4

import type { Platform } from "../types/platform.js";
import type { StrategyDSL, ConditionBlock, ActionBlock, StrategyTrigger } from "../types/strategy.js";
import { parseToFixed18 } from "../normalize/fixed-point.js";

export class NLStrategyCompiler {
  /**
   * Compile plain text instruction into a StrategyDSL object.
   */
  static compile(input: string): StrategyDSL {
    const text = input.trim();
    const lower = text.toLowerCase();

    // 1. Detect Ticker
    const tickerMatch = text.match(/\b(AAPL|NVDA|TSLA|MSFT|AMZN|GOOGL|META)\b/i);
    const ticker = tickerMatch ? tickerMatch[1].toUpperCase() : "AAPL";

    // 2. Detect Platforms
    const platforms: Platform[] = [];
    if (lower.includes("ondo")) platforms.push("ONDO");
    if (lower.includes("bstocks")) platforms.push("BSTOCKS");
    if (lower.includes("xstocks")) platforms.push("XSTOCKS");

    // 3. Detect Action
    let action: ActionBlock;
    if (lower.includes("rotate") || lower.includes("switch")) {
      const fromPlatform: Platform = platforms[0] ?? "ONDO";
      const toPlatform: Platform = platforms[1] ?? (fromPlatform === "ONDO" ? "BSTOCKS" : "ONDO");
      action = {
        type: "ROTATE",
        ticker,
        fromPlatform,
        toPlatform,
      };
    } else if (lower.includes("buy") || lower.includes("dca") || lower.includes("accumulate")) {
      const amountMatch = text.match(/\$\s*(\d+(\.\d+)?)/);
      const amountStr = amountMatch ? amountMatch[1] : "10";
      action = {
        type: "BUY",
        ticker,
        platform: platforms[0] ?? "ONDO",
        amountUsd: parseToFixed18(amountStr),
      };
    } else if (lower.includes("sell") || lower.includes("fade") || lower.includes("exit")) {
      const amountMatch = text.match(/\$\s*(\d+(\.\d+)?)/);
      const amountStr = amountMatch ? amountMatch[1] : "10";
      action = {
        type: "SELL",
        ticker,
        platform: platforms[0] ?? "ONDO",
        amountUsd: parseToFixed18(amountStr),
      };
    } else if (lower.includes("alert") || lower.includes("notify")) {
      action = {
        type: "ALERT",
        channel: lower.includes("telegram") ? "telegram" : "dashboard",
        message: text,
      };
    } else {
      // Default to BUY
      action = {
        type: "BUY",
        ticker,
        platform: "ONDO",
        amountUsd: parseToFixed18("10"),
      };
    }

    // 4. Detect Conditions / Triggers
    const conditions: ConditionBlock[] = [];

    // Basis trigger
    if (lower.includes("basis") || lower.includes("cross-platform")) {
      const basisMatch = text.match(/(\d+)\s*(bps|basis\s*points?)/i);
      const basisBps = basisMatch ? BigInt(basisMatch[1]) : 20n;
      conditions.push({
        type: "CROSS_PLATFORM_BASIS_ABOVE",
        ticker,
        basisBps,
      });
    }

    // Flow trigger
    if (lower.includes("flow") || lower.includes("accumulation") || lower.includes("quiver")) {
      const flowMatch = text.match(/\$\s*(\d[\d,]*)(\.\d+)?/);
      let flowAmountStr = "5000";
      if (flowMatch) {
        flowAmountStr = flowMatch[1].replace(/,/g, "");
      }
      conditions.push({
        type: "FLOW_ACCUMULATION_ABOVE",
        ticker,
        usdAmount: parseToFixed18(flowAmountStr),
      });
    }

    // Oracle divergence trigger
    if (lower.includes("divergence") || lower.includes("oracle")) {
      const divMatch = text.match(/(\d+)\s*(bps|basis\s*points?)/i);
      const divergenceBps = divMatch ? BigInt(divMatch[1]) : 25n;
      conditions.push({
        type: "ORACLE_DIVERGENCE_ABOVE",
        ticker,
        divergenceBps,
      });
    }

    // Weekend premium trigger
    if (lower.includes("weekend") || lower.includes("premium")) {
      const premMatch = text.match(/(\d+)\s*(bps|basis\s*points?)/i);
      const premiumBps = premMatch ? BigInt(premMatch[1]) : 100n;
      conditions.push({
        type: "WEEKEND_PREMIUM_ABOVE",
        ticker,
        premiumBps,
      });
    }

    // Schedule / Cron trigger
    if (lower.includes("every monday") || lower.includes("weekly")) {
      conditions.push({
        type: "TIME_SCHEDULE",
        cron: "0 13 * * 1", // 13:00 UTC Monday
      });
    } else if (lower.includes("market open") || lower.includes("at open")) {
      conditions.push({
        type: "MARKET_OPENS",
      });
    }

    // Build Trigger
    let trigger: StrategyTrigger;
    if (conditions.length === 0) {
      // Default to schedule or basis
      trigger = {
        type: "CROSS_PLATFORM_BASIS_ABOVE",
        ticker,
        basisBps: 20n,
      };
    } else if (conditions.length === 1) {
      trigger = conditions[0]!;
    } else {
      trigger = {
        type: "AND",
        conditions,
      };
    }

    // 5. Detect Policy Constraints
    let maxTradeNotionalUsd = parseToFixed18("10");
    const maxTradeMatch = text.match(/max\s*trade\s*\$?\s*(\d+(\.\d+)?)/i);
    if (maxTradeMatch) {
      maxTradeNotionalUsd = parseToFixed18(maxTradeMatch[1]);
    }

    let maxSlippageBps = 100n;
    const slippageMatch = text.match(/max\s*slippage\s*(\d+(\.\d+)?)%/i);
    if (slippageMatch) {
      const slippagePct = BigInt(slippageMatch[1].split(".")[0] || "1");
      maxSlippageBps = slippagePct * 100n;
    }

    let cooldownSeconds = 300;
    const cooldownMatch = text.match(/cooldown\s*(\d+)\s*(s|sec|seconds?|m|min|minutes?)/i);
    if (cooldownMatch) {
      const num = parseInt(cooldownMatch[1], 10);
      const unit = cooldownMatch[2].toLowerCase();
      cooldownSeconds = unit.startsWith("m") ? num * 60 : num;
    }

    // Generate strategy title
    let name = `${ticker} ${action.type}`;
    if (action.type === "ROTATE") {
      name = `${ticker} Basis Rotation`;
    } else if (lower.includes("dca")) {
      name = `${ticker} DCA`;
    }

    return {
      name,
      trigger,
      action,
      policy: {
        maxTradeNotionalUsd,
        maxSlippageBps,
        cooldownSeconds,
      },
    };
  }
}
