// packages/core/src/services/data-ingestion.ts
//
// Data Ingestion Service for Binance Web3 RWA API and on-chain token data.
// Reference: Spectra.md §5.1, §5.10

import type { Platform, MarketStatus } from "../types/platform.js";
import { parseToFixed18 } from "../normalize/fixed-point.js";
import type { ICacheService } from "./cache.js";

export interface RawRwaToken {
  ticker: string;
  platform: Platform;
  tokenAddress: string;
  tokenPrice: bigint; // 18-dec fixed point
  tokenToShareRatio: bigint; // 18-dec fixed point
  referencePrice?: bigint; // 18-dec fixed point
  marketStatus: MarketStatus;
  nextOpenTime: Date | null;
  dexLiquidityUsd: bigint;
  slippageBps: bigint;
  sector?: string;
  lastUpdated: Date;
  isStale?: boolean;
}

export interface IRwaDataProvider {
  fetchTokens(): Promise<RawRwaToken[]>;
}

/**
 * Mock RWA Data Provider seeded with realistic tokenized equity data
 * including empirical test benchmarks (AAPL Ondo constant spread, etc.)
 */
export class MockRwaDataProvider implements IRwaDataProvider {
  private tokens: RawRwaToken[];

  constructor(customTokens?: RawRwaToken[]) {
    this.tokens = customTokens ?? [
      {
        ticker: "AAPL",
        platform: "ONDO",
        tokenAddress: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4",
        tokenPrice: parseToFixed18("335.02"),
        tokenToShareRatio: parseToFixed18("1.003376073740221058"),
        referencePrice: parseToFixed18("333.89275"),
        marketStatus: "OPEN",
        nextOpenTime: null,
        dexLiquidityUsd: parseToFixed18("250000"),
        slippageBps: 15n,
        sector: "Magnificent 7",
        lastUpdated: new Date(),
      },
      {
        ticker: "AAPL",
        platform: "BSTOCKS",
        tokenAddress: "0x1111111254fb6c44bac0bed2854e76f90643097d",
        tokenPrice: parseToFixed18("334.60"),
        tokenToShareRatio: parseToFixed18("1.000000000000000000"),
        referencePrice: parseToFixed18("334.60"),
        marketStatus: "OPEN",
        nextOpenTime: null,
        dexLiquidityUsd: parseToFixed18("180000"),
        slippageBps: 20n,
        sector: "Magnificent 7",
        lastUpdated: new Date(),
      },
      {
        ticker: "NVDA",
        platform: "ONDO",
        tokenAddress: "0x2222222254fb6c44bac0bed2854e76f90643097d",
        tokenPrice: parseToFixed18("125.50"),
        tokenToShareRatio: parseToFixed18("1.001500000000000000"),
        referencePrice: parseToFixed18("125.312"),
        marketStatus: "OPEN",
        nextOpenTime: null,
        dexLiquidityUsd: parseToFixed18("500000"),
        slippageBps: 10n,
        sector: "AI Chips",
        lastUpdated: new Date(),
      },
      {
        ticker: "NVDA",
        platform: "BSTOCKS",
        tokenAddress: "0x3333333354fb6c44bac0bed2854e76f90643097d",
        tokenPrice: parseToFixed18("125.02"),
        tokenToShareRatio: parseToFixed18("1.000000000000000000"),
        referencePrice: parseToFixed18("125.02"),
        marketStatus: "OPEN",
        nextOpenTime: null,
        dexLiquidityUsd: parseToFixed18("320000"),
        slippageBps: 18n,
        sector: "AI Chips",
        lastUpdated: new Date(),
      },
      {
        ticker: "TSLA",
        platform: "XSTOCKS",
        tokenAddress: "0x4444444454fb6c44bac0bed2854e76f90643097d",
        tokenPrice: parseToFixed18("248.50"),
        tokenToShareRatio: parseToFixed18("1.000000000000000000"),
        referencePrice: parseToFixed18("248.50"),
        marketStatus: "OPEN",
        nextOpenTime: null,
        dexLiquidityUsd: parseToFixed18("120000"),
        slippageBps: 25n,
        sector: "Magnificent 7",
        lastUpdated: new Date(),
      },
    ];
  }

  async fetchTokens(): Promise<RawRwaToken[]> {
    return this.tokens.map((t) => ({ ...t, lastUpdated: new Date() }));
  }

  setTokens(tokens: RawRwaToken[]) {
    this.tokens = tokens;
  }
}

/**
 * Live Binance RWA Data API provider.
 * Connects to public/authenticated Binance Web3 RWA API endpoints.
 */
export class BinanceRwaDataProvider implements IRwaDataProvider {
  private baseUrl: string;
  private apiKey?: string;
  private fetchFn: typeof fetch;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    fetchFn?: typeof fetch;
  }) {
    this.baseUrl = options?.baseUrl ?? "https://api.binance.com";
    this.apiKey = options?.apiKey;
    this.fetchFn = options?.fetchFn ?? fetch;
  }

  async fetchTokens(): Promise<RawRwaToken[]> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (this.apiKey) {
      headers["X-MBX-APIKEY"] = this.apiKey;
    }

    const res = await this.fetchFn(`${this.baseUrl}/bapi/composite/v1/public/rwa/token/list`, {
      headers,
    });
    if (!res.ok) {
      throw new Error(`RWA API error: HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      data?: Array<{
        symbol?: string;
        platform?: string;
        tokenAddress?: string;
        tokenPrice?: string;
        tokenToShareRatio?: string;
        referencePrice?: string;
        marketStatus?: string;
        dexLiquidityUsd?: string;
        slippageBps?: number;
        sector?: string;
      }>;
    };

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((item): RawRwaToken => {
      const ticker = (item.symbol ?? "UNKNOWN").toUpperCase();
      const rawPlatform = (item.platform ?? "ONDO").toUpperCase();
      const platform: Platform =
        rawPlatform === "BSTOCKS" || rawPlatform === "XSTOCKS" ? rawPlatform : "ONDO";

      return {
        ticker,
        platform,
        tokenAddress: item.tokenAddress ?? "0x0000000000000000000000000000000000000000",
        tokenPrice: parseToFixed18(item.tokenPrice ?? "0"),
        tokenToShareRatio: parseToFixed18(item.tokenToShareRatio ?? "1.0"),
        referencePrice: item.referencePrice ? parseToFixed18(item.referencePrice) : undefined,
        marketStatus: (item.marketStatus?.toUpperCase() as MarketStatus) || "OPEN",
        nextOpenTime: null,
        dexLiquidityUsd: item.dexLiquidityUsd ? parseToFixed18(item.dexLiquidityUsd) : 0n,
        slippageBps: item.slippageBps !== undefined ? BigInt(item.slippageBps) : 0n,
        sector: item.sector,
        lastUpdated: new Date(),
      };
    });
  }
}

/**
 * Data Ingestion Service
 * Handles polling, caching, fallback to stale cache during outage (§5.10).
 */
export class DataIngestionService {
  private provider: IRwaDataProvider;
  private cache?: ICacheService;
  private cacheTtlSeconds: number;
  private cachedTokens: RawRwaToken[] = [];
  private lastFetchTime: Date | null = null;
  private isAvailable: boolean = true;

  constructor(
    provider: IRwaDataProvider,
    options?: { cache?: ICacheService; cacheTtlSeconds?: number },
  ) {
    this.provider = provider;
    this.cache = options?.cache;
    this.cacheTtlSeconds = options?.cacheTtlSeconds ?? 60;
  }

  async getStockList(): Promise<RawRwaToken[]> {
    const cacheKey = "rwa:tokens:all";

    if (this.cache) {
      const cached = await this.cache.get<RawRwaToken[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const tokens = await this.provider.fetchTokens();
      this.cachedTokens = tokens;
      this.lastFetchTime = new Date();
      this.isAvailable = true;

      if (this.cache) {
        await this.cache.set(cacheKey, tokens, this.cacheTtlSeconds);
      }

      return tokens;
    } catch {
      // Ingestion failed: Fail closed or serve stale cache with badge (§5.10)
      this.isAvailable = false;
      if (this.cachedTokens.length > 0) {
        return this.cachedTokens.map((t) => ({ ...t, isStale: true }));
      }
      return [];
    }
  }

  async getStock(ticker: string, platform?: Platform): Promise<RawRwaToken | null> {
    const list = await this.getStockList();
    const upper = ticker.toUpperCase();
    if (platform) {
      return (
        list.find((t) => t.ticker === upper && t.platform === platform) ?? null
      );
    }
    return list.find((t) => t.ticker === upper) ?? null;
  }

  async getMarketStatus(): Promise<{
    isOpen: boolean;
    status: MarketStatus;
    nextOpenTime: Date | null;
  }> {
    const tokens = await this.getStockList();
    if (tokens.length === 0) {
      return { isOpen: false, status: "CLOSED", nextOpenTime: null };
    }

    // Determine overall market status from active stocks
    const hasHalt = tokens.some((t) => t.marketStatus === "HALTED");
    if (hasHalt) {
      return { isOpen: false, status: "HALTED", nextOpenTime: null };
    }

    const openCount = tokens.filter((t) => t.marketStatus === "OPEN").length;
    const isOpen = openCount > tokens.length / 2;

    return {
      isOpen,
      status: isOpen ? "OPEN" : "CLOSED",
      nextOpenTime: tokens[0]?.nextOpenTime ?? null,
    };
  }

  getIsAvailable(): boolean {
    return this.isAvailable;
  }

  getLastFetchTime(): Date | null {
    return this.lastFetchTime;
  }
}
