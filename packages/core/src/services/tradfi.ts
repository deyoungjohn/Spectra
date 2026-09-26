// packages/core/src/services/tradfi.ts
//
// External TradFi price feed clients (Finnhub & yfinance fallback).
// As established empirically, external TradFi is the ONLY true independent oracle.
// Reference: Spectra.md §2.3, §5.1, §5.10

import { parseToFixed18 } from "../normalize/fixed-point.js";
import type { ICacheService } from "./cache.js";

export interface TradFiQuote {
  ticker: string;
  price: bigint; // 18-decimal fixed-point
  timestamp: Date;
  source: "finnhub" | "yfinance" | "mock";
  isStale?: boolean;
}

export interface ITradFiClient {
  getQuote(ticker: string): Promise<TradFiQuote | null>;
}

export interface TradFiClientOptions {
  finnhubApiKey?: string;
  cache?: ICacheService;
  cacheTtlSeconds?: number;
  fetchFn?: typeof fetch;
}

/**
 * Finnhub API client for real-time TradFi stock quotes.
 */
export class FinnhubClient implements ITradFiClient {
  private apiKey: string;
  private fetchFn: typeof fetch;

  constructor(apiKey: string, fetchFn: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.fetchFn = fetchFn;
  }

  async getQuote(ticker: string): Promise<TradFiQuote | null> {
    if (!this.apiKey) return null;

    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${this.apiKey}`;
      const res = await this.fetchFn(url, { headers: { Accept: "application/json" } });
      if (!res.ok) return null;

      const data = (await res.json()) as { c?: number; t?: number };
      if (!data || data.c === undefined || data.c === null || data.c <= 0) {
        return null;
      }

      // Convert number to string without using Number or parseFloat
      const priceStr = String(data.c);
      const price = parseToFixed18(priceStr);
      const timestamp = data.t ? new Date(data.t * 1000) : new Date();

      return {
        ticker,
        price,
        timestamp,
        source: "finnhub",
      };
    } catch {
      return null;
    }
  }
}

/**
 * Yahoo Finance fallback client.
 */
export class YFinanceClient implements ITradFiClient {
  private fetchFn: typeof fetch;

  constructor(fetchFn: typeof fetch = fetch) {
    this.fetchFn = fetchFn;
  }

  async getQuote(ticker: string): Promise<TradFiQuote | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`;
      const res = await this.fetchFn(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Accept: "application/json",
        },
      });
      if (!res.ok) return null;

      const json = (await res.json()) as {
        chart?: {
          result?: Array<{
            meta?: { regularMarketPrice?: number; regularMarketTime?: number };
          }>;
        };
      };

      const result = json.chart?.result?.[0];
      const regularPrice = result?.meta?.regularMarketPrice;
      if (regularPrice === undefined || regularPrice === null || regularPrice <= 0) {
        return null;
      }

      const priceStr = String(regularPrice);
      const price = parseToFixed18(priceStr);
      const timeSec = result?.meta?.regularMarketTime;
      const timestamp = timeSec ? new Date(timeSec * 1000) : new Date();

      return {
        ticker,
        price,
        timestamp,
        source: "yfinance",
      };
    } catch {
      return null;
    }
  }
}

/**
 * Composite TradFi client with primary/fallback routing, caching,
 * and missing data handling per Spectra.md §5.10.
 */
export class CompositeTradFiClient implements ITradFiClient {
  private primary: ITradFiClient;
  private fallback: ITradFiClient;
  private cache?: ICacheService;
  private cacheTtlSeconds: number;
  private lastKnownQuotes = new Map<string, TradFiQuote>();

  constructor(
    primary: ITradFiClient,
    fallback: ITradFiClient,
    options?: { cache?: ICacheService; cacheTtlSeconds?: number },
  ) {
    this.primary = primary;
    this.fallback = fallback;
    this.cache = options?.cache;
    this.cacheTtlSeconds = options?.cacheTtlSeconds ?? 120;
  }

  async getQuote(ticker: string): Promise<TradFiQuote | null> {
    const cacheKey = `tradfi:quote:${ticker.toUpperCase()}`;

    if (this.cache) {
      const cached = await this.cache.get<TradFiQuote>(cacheKey);
      if (cached) return cached;
    }

    // Try primary
    let quote = await this.primary.getQuote(ticker);

    // Fall back if primary fails
    if (!quote) {
      quote = await this.fallback.getQuote(ticker);
    }

    if (quote) {
      this.lastKnownQuotes.set(ticker.toUpperCase(), quote);
      if (this.cache) {
        await this.cache.set(cacheKey, quote, this.cacheTtlSeconds);
      }
      return quote;
    }

    // Both failed: retrieve last known quote marked as stale (§5.10)
    const lastKnown = this.lastKnownQuotes.get(ticker.toUpperCase());
    if (lastKnown) {
      return {
        ...lastKnown,
        isStale: true,
      };
    }

    return null;
  }

  getLastKnownQuote(ticker: string): TradFiQuote | null {
    return this.lastKnownQuotes.get(ticker.toUpperCase()) ?? null;
  }
}
