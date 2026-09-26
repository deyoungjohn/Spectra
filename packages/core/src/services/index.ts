// packages/core/src/services/index.ts
//
// Barrel export for core services: caching, TradFi clients, and data ingestion.

export type { ICacheService, CacheEntry } from "./cache.js";
export { MemoryCacheService } from "./cache.js";

export type { TradFiQuote, ITradFiClient, TradFiClientOptions } from "./tradfi.js";
export { FinnhubClient, YFinanceClient, CompositeTradFiClient } from "./tradfi.js";

export type { RawRwaToken, IRwaDataProvider } from "./data-ingestion.js";
export { MockRwaDataProvider, BinanceRwaDataProvider, DataIngestionService } from "./data-ingestion.js";
