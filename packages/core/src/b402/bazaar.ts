// Bazaar Extension Metadata (§5.6, §9.3)
// Provides discovery metadata for autonomous AI agents querying Spectra paid feeds.

import type { BazaarMetadata } from "./types.js";

export const BAZAAR_METADATA: Record<string, BazaarMetadata> = {
  oracleDivergence: {
    description: "Spectra True Oracle Divergence Feed vs TradFi Primary Feeds",
    routeTemplate: "/api/alpha/oracle-divergence/:ticker",
    info: {
      input: {
        type: "http",
        method: "GET",
        pathParams: {
          ticker: "AAPL | TSLA | NVDA | MSFT | AMZN | GOOGL | META",
        },
      },
    },
    schema: {
      type: "object",
      properties: {
        ticker: { type: "string" },
        divergenceBps: { type: "string", description: "Basis points divergence (18 decimals)" },
        divergenceState: { type: "string", enum: ["NORMAL", "MODERATE", "CRITICAL"] },
        onChainPrice: { type: "string" },
        tradFiPrice: { type: "string" },
        direction: { type: "string", enum: ["OVERVALUED", "UNDERVALUED", "ALIGNED"] },
        timestamp: { type: "number" },
      },
      required: ["ticker", "divergenceBps", "divergenceState"],
    },
  },

  weekendPremium: {
    description: "Spectra Weekend Sentiment Premium Feed",
    routeTemplate: "/api/alpha/weekend-premium/:ticker",
    info: {
      input: {
        type: "http",
        method: "GET",
        pathParams: {
          ticker: "AAPL | TSLA | NVDA | MSFT | AMZN | GOOGL | META",
        },
      },
    },
    schema: {
      type: "object",
      properties: {
        ticker: { type: "string" },
        premiumBps: { type: "string" },
        active: { type: "boolean" },
        featureFlagLocked: { type: "boolean" },
        marketStatus: { type: "string" },
        timestamp: { type: "number" },
      },
      required: ["ticker", "premiumBps"],
    },
  },

  basis: {
    description: "Spectra Cross-Platform Basis & Arbitrage Route Feed",
    routeTemplate: "/api/alpha/basis/:ticker",
    info: {
      input: {
        type: "http",
        method: "GET",
        pathParams: {
          ticker: "AAPL | TSLA | NVDA | MSFT | AMZN | GOOGL | META",
        },
      },
    },
    schema: {
      type: "object",
      properties: {
        ticker: { type: "string" },
        spreadBps: { type: "string" },
        buyPlatform: { type: "string" },
        sellPlatform: { type: "string" },
        netProfitBps: { type: "string" },
        timestamp: { type: "number" },
      },
      required: ["ticker", "spreadBps", "buyPlatform", "sellPlatform"],
    },
  },

  flow: {
    description: "Spectra Smart Money Net Flow and Whale Accumulation Radar",
    routeTemplate: "/api/alpha/flow/:ticker",
    info: {
      input: {
        type: "http",
        method: "GET",
        pathParams: {
          ticker: "AAPL | TSLA | NVDA | MSFT | AMZN | GOOGL | META",
        },
      },
    },
    schema: {
      type: "object",
      properties: {
        ticker: { type: "string" },
        signals: { type: "array" },
        positioning: { type: "object" },
        timeSeries: { type: "array" },
        topWallets: { type: "array" },
        timestamp: { type: "number" },
      },
      required: ["ticker", "signals", "positioning"],
    },
  },

  signals: {
    description: "Spectra All Active Cross-Module Alpha Signals Snapshot",
    routeTemplate: "/api/alpha/signals",
    info: {
      input: {
        type: "http",
        method: "GET",
      },
    },
    schema: {
      type: "object",
      properties: {
        signals: { type: "array" },
        count: { type: "number" },
        timestamp: { type: "number" },
      },
      required: ["signals", "count"],
    },
  },

  screener: {
    description: "Spectra Full Screener and Web3 Equity Anomaly Matrix",
    routeTemplate: "/api/alpha/screener",
    info: {
      input: {
        type: "http",
        method: "GET",
      },
    },
    schema: {
      type: "object",
      properties: {
        items: { type: "array" },
        timestamp: { type: "number" },
      },
      required: ["items", "timestamp"],
    },
  },
};

export function getBazaarMetadata(endpointKey: string): BazaarMetadata | undefined {
  return BAZAAR_METADATA[endpointKey];
}
