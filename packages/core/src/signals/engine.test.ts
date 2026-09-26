// packages/core/src/signals/engine.test.ts
import { describe, it, expect } from "vitest";
import { SignalEngine } from "./engine.js";
import type { NormalizedStock } from "../types/normalized-stock.js";
import { parseToFixed18 } from "../normalize/fixed-point.js";

describe("SignalEngine", () => {
  function createTestStock(overrides?: Partial<NormalizedStock>): NormalizedStock {
    return {
      ticker: "AAPL",
      platform: "ONDO",
      tokenAddress: "0x123",
      tokenPrice: parseToFixed18("335.02"),
      tokenToShareRatio: parseToFixed18("1.003376073740221058"),
      perSharePrice: parseToFixed18("333.89"),
      tradfiPrice: parseToFixed18("333.90"),
      oracleDivergenceBps: 0n,
      weekendPremiumBps: 0n,
      crossPlatformBasisBps: 0n,
      dexLiquidityUsd: parseToFixed18("50000"),
      slippageBps: 10n,
      marketStatus: "OPEN",
      nextOpenTime: null,
      lastUpdated: new Date(),
      ...overrides,
    };
  }

  it("Signal A: Oracle Divergence triggers warning at >10 bps and critical halt at >25 bps during OPEN session", () => {
    const engine = new SignalEngine();

    // 15 bps divergence -> warning
    const warningStock = createTestStock({
      marketStatus: "OPEN",
      oracleDivergenceBps: 15n,
    });
    const signals1 = engine.evaluateStock(warningStock);
    const divSig1 = signals1.find((s) => s.type === "ORACLE_DIVERGENCE");
    expect(divSig1).toBeDefined();
    expect(divSig1?.severity).toBe("warning");
    expect(divSig1?.actionable).toBe(false); // Alert only
    expect(engine.hasActiveHalt("AAPL")).toBe(false);

    // 30 bps divergence -> critical halt
    const haltStock = createTestStock({
      marketStatus: "OPEN",
      oracleDivergenceBps: 30n,
    });
    const signals2 = engine.evaluateStock(haltStock);
    const divSig2 = signals2.find((s) => s.type === "ORACLE_DIVERGENCE");
    expect(divSig2).toBeDefined();
    expect(divSig2?.severity).toBe("critical");
    expect(divSig2?.actionable).toBe(true);
    expect(engine.hasActiveHalt("AAPL")).toBe(true);
  });

  it("Signal A: Oracle Divergence suspends if TradFi feed is down (§5.10)", () => {
    const engine = new SignalEngine();
    const stockWithoutTradFi = createTestStock({
      marketStatus: "OPEN",
      tradfiPrice: 0n, // Feed down
      oracleDivergenceBps: 50n,
    });

    const signals = engine.evaluateStock(stockWithoutTradFi);
    const divSig = signals.find((s) => s.type === "ORACLE_DIVERGENCE");
    expect(divSig).toBeUndefined(); // Suspended
  });

  it("Signal B: Weekend Premium is LOCKED by default feature flag (§2.4)", () => {
    // Default feature flags: SIGNAL_WEEKEND_PREMIUM = false
    const engine = new SignalEngine();
    const closedStock = createTestStock({
      marketStatus: "CLOSED",
      weekendPremiumBps: 150n,
    });

    const signals = engine.evaluateStock(closedStock);
    const premSig = signals.find((s) => s.type === "WEEKEND_PREMIUM");
    expect(premSig).toBeUndefined(); // Locked
  });

  it("Signal B: Weekend Premium triggers when feature flag is enabled", () => {
    const engine = new SignalEngine({
      features: { SIGNAL_WEEKEND_PREMIUM: true },
    });
    const closedStock = createTestStock({
      marketStatus: "CLOSED",
      weekendPremiumBps: 150n,
    });

    const signals = engine.evaluateStock(closedStock);
    const premSig = signals.find((s) => s.type === "WEEKEND_PREMIUM");
    expect(premSig).toBeDefined();
    expect(premSig?.value).toBe(150n);
    expect(premSig?.regime).toBe("CLOSED");
  });

  it("Signal C: Cross-Platform Basis triggers when spread exceeds threshold (>20 bps)", () => {
    const engine = new SignalEngine();
    const stock = createTestStock({
      crossPlatformBasisBps: 25n,
    });

    const signals = engine.evaluateStock(stock);
    const basisSig = signals.find((s) => s.type === "BASIS");
    expect(basisSig).toBeDefined();
    expect(basisSig?.value).toBe(25n);
    expect(basisSig?.actionable).toBe(true);
  });

  it("Signal D: Flow Accumulation triggers when net flow exceeds $5,000 threshold", () => {
    const engine = new SignalEngine();
    // Record $6,000 net accumulation
    const flowAmount = parseToFixed18("6000");
    engine.recordFlow("AAPL", flowAmount);

    const stock = createTestStock();
    const signals = engine.evaluateStock(stock);
    const flowSig = signals.find((s) => s.type === "FLOW");
    expect(flowSig).toBeDefined();
    expect(flowSig?.value).toBe(flowAmount);
  });

  it("Signal E: Liquidity Alert triggers when DEX liquidity depth is below $1,000", () => {
    const engine = new SignalEngine();
    const lowLiqStock = createTestStock({
      dexLiquidityUsd: parseToFixed18("800"), // < $1,000
    });

    const signals = engine.evaluateStock(lowLiqStock);
    const liqSig = signals.find((s) => s.type === "LIQUIDITY");
    expect(liqSig).toBeDefined();
    expect(liqSig?.severity).toBe("warning");
  });

  it("Signal F: Ratio Drift emits actionable warning signal", () => {
    const engine = new SignalEngine();
    const driftSignal = engine.handleRatioDrift({
      ticker: "AAPL",
      platform: "ONDO",
      oldRatio: parseToFixed18("1.000"),
      newRatio: parseToFixed18("1.003376"),
      timestamp: new Date(),
    });

    expect(driftSignal.type).toBe("RATIO_DRIFT");
    expect(driftSignal.severity).toBe("warning");
    expect(driftSignal.actionable).toBe(true);
    expect(engine.getActiveSignals().some((s) => s.type === "RATIO_DRIFT")).toBe(true);
  });
});
