// packages/core/src/strategy/templates.ts
//
// 4 Pre-built Strategy Templates for Strategy Forge.
// Reference: Spectra.md §7.7

import { parseToFixed18 } from "../normalize/fixed-point.js";
import type { StrategyTemplate } from "./types.js";

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: "dca-weekly",
    name: "Weekly DCA",
    description: "Buy $X of a tokenized stock every Monday at US market open",
    category: "DCA",
    defaultTicker: "AAPL",
    estimatedApyBps: 850,
    dsl: {
      name: "Weekly DCA",
      trigger: {
        type: "TIME_SCHEDULE",
        cron: "0 13 * * 1",
      },
      action: {
        type: "BUY",
        ticker: "AAPL",
        platform: "ONDO",
        amountUsd: parseToFixed18("10"),
      },
      policy: {
        maxTradeNotionalUsd: parseToFixed18("10"),
        maxSlippageBps: 100n,
        cooldownSeconds: 0,
      },
    },
  },
  {
    id: "basis-rotation",
    name: "Cross-Platform Basis Rotation",
    description: "Rotate between Ondo and bStocks when pricing basis exceeds 20 bps net",
    category: "ARBITRAGE",
    defaultTicker: "AAPL",
    estimatedApyBps: 1420,
    dsl: {
      name: "Cross-Platform Basis Rotation",
      trigger: {
        type: "CROSS_PLATFORM_BASIS_ABOVE",
        ticker: "AAPL",
        basisBps: 20n,
      },
      action: {
        type: "ROTATE",
        ticker: "AAPL",
        fromPlatform: "ONDO",
        toPlatform: "BSTOCKS",
      },
      policy: {
        maxTradeNotionalUsd: parseToFixed18("10"),
        maxSlippageBps: 100n,
        cooldownSeconds: 300,
      },
    },
  },
  {
    id: "oracle-divergence-halt",
    name: "Oracle Divergence Guard",
    description: "Emit alert and pause trading if on-chain price diverges > 25 bps from TradFi",
    category: "GUARD",
    defaultTicker: "AAPL",
    dsl: {
      name: "Oracle Divergence Guard",
      trigger: {
        type: "ORACLE_DIVERGENCE_ABOVE",
        ticker: "AAPL",
        divergenceBps: 25n,
      },
      action: {
        type: "ALERT",
        channel: "telegram",
        message: "Oracle divergence detected on AAPL above 25 bps threshold",
      },
      policy: {
        maxTradeNotionalUsd: 0n,
        maxSlippageBps: 0n,
        cooldownSeconds: 60,
      },
    },
  },
  {
    id: "weekend-premium-fade",
    name: "Weekend Premium Fade",
    description: "Take profit when weekend sentiment premium exceeds 150 bps",
    category: "TACTICAL",
    defaultTicker: "AAPL",
    estimatedApyBps: 650,
    dsl: {
      name: "Weekend Premium Fade",
      trigger: {
        type: "WEEKEND_PREMIUM_ABOVE",
        ticker: "AAPL",
        premiumBps: 150n,
      },
      action: {
        type: "SELL",
        ticker: "AAPL",
        platform: "ONDO",
        amountUsd: parseToFixed18("10"),
      },
      policy: {
        maxTradeNotionalUsd: parseToFixed18("10"),
        maxSlippageBps: 150n,
        cooldownSeconds: 300,
      },
    },
  },
];

/** Customize a template with a specific ticker and trade amount */
export function customizeTemplate(
  templateId: string,
  params: { ticker?: string; amountUsd?: bigint; platform?: "ONDO" | "BSTOCKS" | "XSTOCKS" },
): StrategyTemplate | null {
  const tpl = STRATEGY_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return null;

  const targetTicker = (params.ticker ?? tpl.defaultTicker).toUpperCase();

  const customized: StrategyTemplate = {
    id: tpl.id,
    name: `${tpl.name} (${targetTicker})`,
    description: tpl.description,
    category: tpl.category,
    defaultTicker: targetTicker,
    estimatedApyBps: tpl.estimatedApyBps,
    dsl: {
      name: `${tpl.dsl.name} (${targetTicker})`,
      trigger: { ...tpl.dsl.trigger },
      action: { ...tpl.dsl.action },
      policy: { ...tpl.dsl.policy },
    },
  };

  // Update action & policy amount
  if ("ticker" in customized.dsl.action) {
    customized.dsl.action.ticker = targetTicker;
  }
  if (params.amountUsd) {
    if ("amountUsd" in customized.dsl.action) {
      customized.dsl.action.amountUsd = params.amountUsd;
    }
    customized.dsl.policy.maxTradeNotionalUsd = params.amountUsd;
  }
  if ("platform" in customized.dsl.action && params.platform) {
    customized.dsl.action.platform = params.platform;
  }

  // Update trigger
  if ("ticker" in customized.dsl.trigger) {
    customized.dsl.trigger.ticker = targetTicker;
  }

  return customized;
}
