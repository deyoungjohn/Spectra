// packages/core/src/flow/bscscan.ts
//
// BscScan API client and mock provider for token transfer events on BSC.
// Reference: Spectra.md §5.10, §8.2, §14

import type { Platform } from "../types/platform.js";
import { parseToFixed18, mulFixed } from "../normalize/fixed-point.js";
import type { ICacheService } from "../services/cache.js";
import type { BscScanProvider, TokenTransferEvent } from "./types.js";

/** Default token contract address mappings for well-known BSC tokenized equities */
export const DEFAULT_BSC_TOKEN_MAP: Record<string, { ticker: string; platform: Platform; defaultPriceUsd: string }> = {
  "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4": { ticker: "AAPL", platform: "ONDO", defaultPriceUsd: "335.02" },
  "0x1111111254fb6c44bac0bed2854e76f90643097d": { ticker: "AAPL", platform: "BSTOCKS", defaultPriceUsd: "334.60" },
  "0x2222222254fb6c44bac0bed2854e76f90643097e": { ticker: "AAPL", platform: "XSTOCKS", defaultPriceUsd: "335.80" },
  "0x490a684ef9cade28a7ad0dfa61ab1eb3842618c5": { ticker: "NVDA", platform: "ONDO", defaultPriceUsd: "130.00" },
  "0x590a684ef9cade28a7ad0dfa61ab1eb3842618c6": { ticker: "TSLA", platform: "ONDO", defaultPriceUsd: "250.00" },
  "0x690a684ef9cade28a7ad0dfa61ab1eb3842618c7": { ticker: "MSFT", platform: "ONDO", defaultPriceUsd: "430.00" },
};

/** Seed data generator for MockBscScanProvider */
export function createDefaultMockTransfers(): TokenTransferEvent[] {
  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;

  return [
    // Whale 1 (0x71C6...8B29): Strong AAPL accumulator
    {
      hash: "0x1a8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345671",
      blockNumber: 38450100n,
      timestamp: new Date(now - 1 * ONE_HOUR),
      from: "0x1111111254fb6c44bac0bed2854e76f90643097d", // DEX pool
      to: "0x71C65E5f16252F90F2b876632431264b4c818B29",
      tokenAddress: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4",
      ticker: "AAPL",
      platform: "ONDO",
      valueTokens: parseToFixed18("50"), // 50 shares
      valueUsd: parseToFixed18("16751.00"), // Whale transaction ($16.7k > $10k threshold)
    },
    {
      hash: "0x2b8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345672",
      blockNumber: 38450300n,
      timestamp: new Date(now - 2 * ONE_HOUR),
      from: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      to: "0x71C65E5f16252F90F2b876632431264b4c818B29",
      tokenAddress: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4",
      ticker: "AAPL",
      platform: "ONDO",
      valueTokens: parseToFixed18("30"),
      valueUsd: parseToFixed18("10050.60"),
    },
    // Wallet 2 (0x3aF8...91c1): NVDA distribution / whale dump
    {
      hash: "0x3c8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345673",
      blockNumber: 38450400n,
      timestamp: new Date(now - 3 * ONE_HOUR),
      from: "0x3aF89E198302fD271926673193a0283084C991c1",
      to: "0x1111111254fb6c44bac0bed2854e76f90643097d", // selling to DEX pool
      tokenAddress: "0x490a684ef9cade28a7ad0dfa61ab1eb3842618c5",
      ticker: "NVDA",
      platform: "ONDO",
      valueTokens: parseToFixed18("200"),
      valueUsd: parseToFixed18("26000.00"), // Whale sell ($26k > $10k threshold)
    },
    // Wallet 3 (0x88B1...A102): Cross-platform accumulator on MSFT (Ondo + bStocks)
    {
      hash: "0x4d8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345674",
      blockNumber: 38450500n,
      timestamp: new Date(now - 30 * 60 * 1000), // 30 mins ago
      from: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      to: "0x88B1c9012a456d8ef1234567890abcdef123A102",
      tokenAddress: "0x690a684ef9cade28a7ad0dfa61ab1eb3842618c7",
      ticker: "MSFT",
      platform: "ONDO",
      valueTokens: parseToFixed18("20"),
      valueUsd: parseToFixed18("8600.00"),
    },
    // Wallet 4 (0x99C4...F304): TSLA accumulation
    {
      hash: "0x5e8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345675",
      blockNumber: 38450600n,
      timestamp: new Date(now - 15 * 60 * 1000), // 15 mins ago
      from: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      to: "0x99C490abcdef1234567890abcdef12345678F304",
      tokenAddress: "0x590a684ef9cade28a7ad0dfa61ab1eb3842618c6",
      ticker: "TSLA",
      platform: "ONDO",
      valueTokens: parseToFixed18("30"),
      valueUsd: parseToFixed18("7500.00"),
    },
    // Retail inflow for AAPL bStocks
    {
      hash: "0x6f8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345676",
      blockNumber: 38450700n,
      timestamp: new Date(now - 50 * 60 * 1000),
      from: "0x0000000000000000000000000000000000000000", // mint / bridge
      to: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      tokenAddress: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      ticker: "AAPL",
      platform: "BSTOCKS",
      valueTokens: parseToFixed18("10"),
      valueUsd: parseToFixed18("3346.00"),
    },
    // Cross-platform flow for AAPL xStocks
    {
      hash: "0x7a8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345677",
      blockNumber: 38450800n,
      timestamp: new Date(now - 120 * 60 * 1000),
      from: "0x2222222254fb6c44bac0bed2854e76f90643097e",
      to: "0x88B1c9012a456d8ef1234567890abcdef123A102",
      tokenAddress: "0x2222222254fb6c44bac0bed2854e76f90643097e",
      ticker: "AAPL",
      platform: "XSTOCKS",
      valueTokens: parseToFixed18("8"),
      valueUsd: parseToFixed18("2686.40"),
    },
  ];
}

/**
 * Mock BscScan Provider for local testing and deterministic pipeline validation.
 */
export class MockBscScanProvider implements BscScanProvider {
  private transfers: TokenTransferEvent[];

  constructor(customTransfers?: TokenTransferEvent[]) {
    this.transfers = customTransfers ?? createDefaultMockTransfers();
  }

  async getTokenTransfers(params: {
    tokenAddress?: string;
    ticker?: string;
    limit?: number;
  }): Promise<TokenTransferEvent[]> {
    let result = [...this.transfers];

    if (params.tokenAddress) {
      const lower = params.tokenAddress.toLowerCase();
      result = result.filter((t) => t.tokenAddress.toLowerCase() === lower);
    }

    if (params.ticker) {
      const upper = params.ticker.toUpperCase();
      result = result.filter((t) => t.ticker === upper);
    }

    if (params.limit && params.limit > 0) {
      result = result.slice(0, params.limit);
    }

    return result;
  }

  /** Add transfer event dynamically (useful in tests) */
  addTransfer(transfer: TokenTransferEvent) {
    this.transfers.unshift(transfer);
  }
}

/**
 * Production BscScan HTTP Client with caching and automatic fallback to mock/cache.
 * Reference: Spectra.md §5.10, §13
 */
export class HttpBscScanClient implements BscScanProvider {
  private apiKey: string;
  private baseUrl: string;
  private cache?: ICacheService;
  private fallback: MockBscScanProvider;
  private tokenMap: Record<string, { ticker: string; platform: Platform; defaultPriceUsd: string }>;

  constructor(options: {
    apiKey?: string;
    baseUrl?: string;
    cache?: ICacheService;
    fallbackProvider?: MockBscScanProvider;
    tokenMap?: Record<string, { ticker: string; platform: Platform; defaultPriceUsd: string }>;
  }) {
    this.apiKey = options.apiKey || process.env.BSCSCAN_API_KEY || "";
    this.baseUrl = options.baseUrl || "https://api.bscscan.com/api";
    this.cache = options.cache;
    this.fallback = options.fallbackProvider || new MockBscScanProvider();
    this.tokenMap = options.tokenMap || DEFAULT_BSC_TOKEN_MAP;
  }

  async getTokenTransfers(params: {
    tokenAddress?: string;
    ticker?: string;
    limit?: number;
  }): Promise<TokenTransferEvent[]> {
    // If no API key or in dev without key, degrade to mock provider
    if (!this.apiKey) {
      return this.fallback.getTokenTransfers(params);
    }

    const cacheKey = `bscscan:transfers:${params.tokenAddress || params.ticker || "all"}:${params.limit || 50}`;
    if (this.cache) {
      const cached = await this.cache.get<TokenTransferEvent[]>(cacheKey);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    }

    try {
      const contractAddress = params.tokenAddress || this.findContractAddressForTicker(params.ticker);
      if (!contractAddress) {
        return this.fallback.getTokenTransfers(params);
      }

      const url = `${this.baseUrl}?module=account&action=tokentx&contractaddress=${contractAddress}&page=1&offset=${params.limit || 50}&sort=desc&apikey=${this.apiKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        throw new Error(`BscScan HTTP error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        status: string;
        message: string;
        result: Array<{
          hash: string;
          blockNumber: string;
          timeStamp: string;
          from: string;
          to: string;
          contractAddress: string;
          value: string;
          tokenDecimal: string;
        }>;
      };

      if (data.status !== "1" || !Array.isArray(data.result)) {
        // Fall back gracefully to cache or mock
        return this.fallback.getTokenTransfers(params);
      }

      const meta = this.tokenMap[contractAddress.toLowerCase()] || {
        ticker: params.ticker || "UNKNOWN",
        platform: "ONDO" as Platform,
        defaultPriceUsd: "100.00",
      };

      const priceUsd18 = parseToFixed18(meta.defaultPriceUsd);

      const events: TokenTransferEvent[] = data.result.map((item) => {
        // BscScan token transfers value is an integer string in token decimals
        const decimals = BigInt(item.tokenDecimal || "18");
        const rawVal = BigInt(item.value || "0");
        // Normalize to 18 decimals
        const valueTokens = decimals === 18n ? rawVal : (rawVal * (10n ** 18n)) / (10n ** decimals);
        const valueUsd = mulFixed(valueTokens, priceUsd18);

        return {
          hash: item.hash,
          blockNumber: BigInt(item.blockNumber),
          timestamp: new Date(parseInt(item.timeStamp, 10) * 1000),
          from: item.from,
          to: item.to,
          tokenAddress: item.contractAddress,
          ticker: meta.ticker,
          platform: meta.platform,
          valueTokens,
          valueUsd,
        };
      });

      if (this.cache) {
        await this.cache.set(cacheKey, events, 30); // 30s TTL per §5.1.2
      }

      return events;
    } catch {
      // Degrade gracefully per §5.10 / §13
      return this.fallback.getTokenTransfers(params);
    }
  }

  private findContractAddressForTicker(ticker?: string): string | undefined {
    if (!ticker) return undefined;
    const upper = ticker.toUpperCase();
    for (const [address, meta] of Object.entries(this.tokenMap)) {
      if (meta.ticker.toUpperCase() === upper) {
        return address;
      }
    }
    return undefined;
  }
}
