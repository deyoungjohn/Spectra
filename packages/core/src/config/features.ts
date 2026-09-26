// packages/core/src/config/features.ts
//
// Feature flags for the Spectra system.
// Every module and risky feature is gated by a flag here.
//
// Reference: Spectra.md §5.8
// These flags enable the modular strip-out plan (§17).

export interface FeatureFlags {
  /** Module 1: Market Intelligence (Finviz layer) */
  MODULE_1_MARKET_INTEL: boolean;

  /** Module 2: Strategy Forge (Composer layer) */
  MODULE_2_STRATEGY_FORGE: boolean;

  /** Module 3: Flow Radar (Quiver Quant layer) */
  MODULE_3_FLOW_RADAR: boolean;

  /** b402 payment mode: "official" | "shadow" | "auto" */
  B402_MODE: "official" | "shadow" | "auto";

  /** TradFi data source: "finnhub" | "yfinance" */
  TRADFI_SOURCE: "finnhub" | "yfinance";

  /** BNB Agent Studio integration */
  AGENT_STUDIO_ENABLED: boolean;

  /** Telegram push alerts */
  TELEGRAM_ALERTS: boolean;

  /** Live trading on BSC mainnet — DANGER */
  LIVE_TRADING: boolean;

  /** Maximum USD value for a single live trade */
  MAX_LIVE_TRADE_USD: number;

  /**
   * Weekend Sentiment Premium signal.
   * LOCKED until the weekend empirical test passes.
   * Reference: Spectra.md §2.4
   */
  SIGNAL_WEEKEND_PREMIUM: boolean;
}

/**
 * Default feature flags — safe for development.
 * All risky features are OFF by default.
 */
export const DEFAULT_FEATURES: FeatureFlags = {
  MODULE_1_MARKET_INTEL: true,
  MODULE_2_STRATEGY_FORGE: true,
  MODULE_3_FLOW_RADAR: true,
  B402_MODE: "shadow",
  TRADFI_SOURCE: "yfinance",
  AGENT_STUDIO_ENABLED: false,
  TELEGRAM_ALERTS: false,
  LIVE_TRADING: false,
  MAX_LIVE_TRADE_USD: 10,
  SIGNAL_WEEKEND_PREMIUM: false, // LOCKED — see §2.4
};

/**
 * Load feature flags from environment variables, falling back to defaults.
 */
export function loadFeatureFlags(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): FeatureFlags {
  return {
    MODULE_1_MARKET_INTEL: envBool(env, "MODULE_1_MARKET_INTEL", DEFAULT_FEATURES.MODULE_1_MARKET_INTEL),
    MODULE_2_STRATEGY_FORGE: envBool(env, "MODULE_2_STRATEGY_FORGE", DEFAULT_FEATURES.MODULE_2_STRATEGY_FORGE),
    MODULE_3_FLOW_RADAR: envBool(env, "MODULE_3_FLOW_RADAR", DEFAULT_FEATURES.MODULE_3_FLOW_RADAR),
    B402_MODE: envEnum(env, "B402_MODE", ["official", "shadow", "auto"], DEFAULT_FEATURES.B402_MODE),
    TRADFI_SOURCE: envEnum(env, "TRADFI_SOURCE", ["finnhub", "yfinance"], DEFAULT_FEATURES.TRADFI_SOURCE),
    AGENT_STUDIO_ENABLED: envBool(env, "AGENT_STUDIO_ENABLED", DEFAULT_FEATURES.AGENT_STUDIO_ENABLED),
    TELEGRAM_ALERTS: envBool(env, "TELEGRAM_ALERTS", DEFAULT_FEATURES.TELEGRAM_ALERTS),
    LIVE_TRADING: envBool(env, "LIVE_TRADING", DEFAULT_FEATURES.LIVE_TRADING),
    MAX_LIVE_TRADE_USD: envInt(env, "MAX_LIVE_TRADE_USD", DEFAULT_FEATURES.MAX_LIVE_TRADE_USD),
    SIGNAL_WEEKEND_PREMIUM: envBool(env, "SIGNAL_WEEKEND_PREMIUM", DEFAULT_FEATURES.SIGNAL_WEEKEND_PREMIUM),
  };
}

// ── Helper functions ──

function envBool(
  env: Record<string, string | undefined>,
  key: string,
  fallback: boolean,
): boolean {
  const val = env[key];
  if (val === undefined) return fallback;
  return val === "true" || val === "1";
}

function envEnum<T extends string>(
  env: Record<string, string | undefined>,
  key: string,
  allowed: T[],
  fallback: T,
): T {
  const val = env[key] as T | undefined;
  if (val === undefined || !allowed.includes(val)) return fallback;
  return val;
}

function envInt(
  env: Record<string, string | undefined>,
  key: string,
  fallback: number,
): number {
  const val = env[key];
  if (val === undefined) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}
