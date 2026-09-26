// packages/core/src/flow/types.ts
//
// Types and interfaces for Module 3: Flow Radar (The Quiver Quant Layer).
// Reference: Spectra.md §5.3, §8

import type { Platform } from "../types/platform.js";
import type { AlphaSignal } from "../types/signal.js";

/** A single token transfer event on BSC */
export interface TokenTransferEvent {
  /** Transaction hash */
  hash: string;
  /** Block number */
  blockNumber: bigint;
  /** Timestamp of the block */
  timestamp: Date;
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string;
  /** Token smart contract address on BSC */
  tokenAddress: string;
  /** Underlier stock ticker (AAPL, NVDA, TSLA, etc.) */
  ticker: string;
  /** Platform issuer (ONDO, BSTOCKS, XSTOCKS) */
  platform: Platform;
  /** Transferred token amount (18-decimal fixed-point) */
  valueTokens: bigint;
  /** Estimated USD value at the time of transfer (18-decimal fixed-point) */
  valueUsd: bigint;
}

/** Wallet flow summary for accumulation tracking */
export interface WalletFlowSummary {
  /** Wallet address (checksummed hex) */
  address: string;
  /** Human-readable label (e.g. "Whale 0x71...29", "Binance Hot Wallet") */
  label: string;
  /** Ticker */
  ticker: string;
  /** Total token inflows (18-decimal fixed-point USD) */
  inflowUsd: bigint;
  /** Total token outflows (18-decimal fixed-point USD) */
  outflowUsd: bigint;
  /** Net flow: inflow - outflow (18-decimal fixed-point USD, can be negative) */
  netFlowUsd: bigint;
  /** Estimated current holdings value (18-decimal fixed-point USD) */
  holdingUsd: bigint;
  /** Total number of transfers observed */
  txCount: number;
  /** Last active timestamp */
  lastActive: Date;
}

/** Whale alert record for large transactions */
export interface WhaleAlert {
  id: string;
  hash: string;
  timestamp: Date;
  ticker: string;
  platform: Platform;
  wallet: string;
  walletLabel: string;
  direction: "INFLOW" | "OUTFLOW";
  amountTokens: bigint;
  amountUsd: bigint;
}

/** Time-series data point for net flow charts */
export interface FlowTimeSeriesPoint {
  /** ISO timestamp string or hour bucket label */
  timestamp: string;
  /** Total inflows in window (18-decimal fixed-point USD) */
  inflowUsd: bigint;
  /** Total outflows in window (18-decimal fixed-point USD) */
  outflowUsd: bigint;
  /** Net flow in window (inflow - outflow, 18-decimal fixed-point USD) */
  netFlowUsd: bigint;
}

/** Cross-platform net flow breakdown for a ticker */
export interface CrossPlatformFlowSummary {
  ticker: string;
  ondoNetFlowUsd: bigint;
  bStocksNetFlowUsd: bigint;
  xStocksNetFlowUsd: bigint;
  totalNetFlowUsd: bigint;
  dominantPlatform: Platform;
}

/** Aggregated flow summary for a ticker */
export interface TickerFlowSummary {
  ticker: string;
  /** Net flow over trailing 1 hour */
  netFlow1hUsd: bigint;
  /** Net flow over trailing 4 hours */
  netFlow4hUsd: bigint;
  /** Net flow over trailing 24 hours */
  netFlow24hUsd: bigint;
  /** Total gross inflows over 24 hours */
  inflow24hUsd: bigint;
  /** Total gross outflows over 24 hours */
  outflow24hUsd: bigint;
  /** Top wallets accumulating or distributing this ticker */
  topWallets: WalletFlowSummary[];
  /** Recent whale alerts for this ticker */
  whaleAlerts: WhaleAlert[];
  /** Flag indicating abnormal accumulation while TradFi market was closed */
  preEventPositioning: boolean;
  /** Cross-platform breakdown */
  crossPlatform: CrossPlatformFlowSummary;
}

/** Overall market flow dashboard summary */
export interface FlowDashboardSummary {
  /** Total 24h net flow across all tracked tokens */
  totalMarketNetFlow24hUsd: bigint;
  /** Tickers with highest positive net flow */
  topAccumulated: { ticker: string; netFlow24hUsd: bigint; dominantPlatform: Platform }[];
  /** Tickers with highest negative net flow */
  topDistributed: { ticker: string; netFlow24hUsd: bigint; dominantPlatform: Platform }[];
  /** Recent high-conviction whale alerts */
  recentWhaleAlerts: WhaleAlert[];
  /** Timestamp of aggregation */
  lastUpdated: Date;
  /** Whether the module is operating in stale/fallback mode */
  isStale: boolean;
}

/** Flow signal sub-types */
export type FlowSignalCategory = "FLOW_ACCUMULATION" | "FLOW_DISTRIBUTION" | "WHALE_MOVEMENT";

/** Extended flow signal detail */
export interface FlowSignalDetail {
  signal: AlphaSignal;
  category: FlowSignalCategory;
  netFlow4hUsd: bigint;
  thresholdUsd: bigint;
  whaleAddress?: string;
}

/** Interface for BscScan or mock data provider */
export interface BscScanProvider {
  /** Fetch token transfer events for a token address or ticker */
  getTokenTransfers(params: {
    tokenAddress?: string;
    ticker?: string;
    limit?: number;
  }): Promise<TokenTransferEvent[]>;
}
