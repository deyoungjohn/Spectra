// packages/core/src/types/normalized-stock.ts
//
// The NormalizedStock interface is the canonical data shape for every
// tokenized equity across the system. All prices use bigint 18-decimal
// fixed-point arithmetic.
//
// Reference: Spectra.md §5.2

import type { Platform, MarketStatus } from "./platform.js";

/**
 * Canonical normalized representation of a tokenized stock.
 *
 * ALL price fields are bigint in 18-decimal fixed-point format.
 * ALL spread fields are integer basis points (bigint).
 */
export interface NormalizedStock {
  /** Ticker symbol, e.g. "AAPL" */
  ticker: string;

  /** Which platform this token is on */
  platform: Platform;

  /** BSC contract address for the tokenized stock */
  tokenAddress: string;

  // ── Prices (all bigint, 18-decimal fixed point) ──

  /** Per-token on-chain price */
  tokenPrice: bigint;

  /** Live ratio, fetched per poll — never hardcoded */
  tokenToShareRatio: bigint;

  /** Per-share price = divFixed(tokenPrice, tokenToShareRatio) */
  perSharePrice: bigint;

  /** External TradFi anchor price (from Finnhub or yfinance) */
  tradfiPrice: bigint;

  // ── Spreads (integer basis points, bigint) ──

  /**
   * Oracle divergence: perSharePrice vs tradfiPrice.
   * Positive = on-chain premium. Negative = discount.
   */
  oracleDivergenceBps: bigint;

  /** Weekend sentiment premium vs frozen TradFi close */
  weekendPremiumBps: bigint;

  /** Cross-platform basis (min vs max per-share price across platforms) */
  crossPlatformBasisBps: bigint;

  // ── Liquidity ──

  /** DEX liquidity in smallest stablecoin unit */
  dexLiquidityUsd: bigint;

  /** Estimated slippage in integer bps */
  slippageBps: bigint;

  // ── Meta ──

  /** Current market session status */
  marketStatus: MarketStatus;

  /** When the market next opens (null if currently open) */
  nextOpenTime: Date | null;

  /** When this data was last refreshed */
  lastUpdated: Date;
}
