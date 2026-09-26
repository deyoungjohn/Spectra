// packages/core/src/policy/engine.test.ts
import { describe, it, expect } from "vitest";
import { PolicyEngine, type TradeProposal } from "./engine.js";
import { SignalEngine } from "../signals/engine.js";
import type { ExecutionPolicy } from "../types/policy.js";
import { parseToFixed18 } from "../normalize/fixed-point.js";

describe("PolicyEngine", () => {
  const defaultPolicy: ExecutionPolicy = {
    userId: "0xUser123",
    maxTradeNotionalUsd: parseToFixed18("10"), // $10 max trade
    maxSlippageBps: 100n, // 1% max slippage
    cooldownSeconds: 60, // 60s cooldown
    dailyLimitUsd: parseToFixed18("50"), // $50 daily limit
    allowedTokens: ["0xTokenA"],
    killSwitch: false,
  };

  const validTrade: TradeProposal = {
    ticker: "AAPL",
    tokenAddress: "0xTokenA",
    direction: "BUY",
    amountUsd: parseToFixed18("5"),
    expectedSlippageBps: 50n,
  };

  it("approves valid trade conforming to all policy constraints", () => {
    const engine = new PolicyEngine();
    const result = engine.checkTrade(defaultPolicy, validTrade);
    expect(result.allowed).toBe(true);
    expect(result.reasonCode).toBeNull();
  });

  it("blocks trade when killSwitch is active", () => {
    const engine = new PolicyEngine();
    const policy = { ...defaultPolicy, killSwitch: true };
    const result = engine.checkTrade(policy, validTrade);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("KILL_SWITCH");
  });

  it("blocks trade when an active halt signal is present on the ticker", () => {
    const signalEngine = new SignalEngine();
    // Simulate active halt
    signalEngine.evaluateStock({
      ticker: "AAPL",
      platform: "ONDO",
      tokenAddress: "0xTokenA",
      tokenPrice: parseToFixed18("135"),
      tokenToShareRatio: parseToFixed18("1.0"),
      perSharePrice: parseToFixed18("135"),
      tradfiPrice: parseToFixed18("100"), // 3500 bps divergence -> critical halt
      oracleDivergenceBps: 3500n,
      weekendPremiumBps: 0n,
      crossPlatformBasisBps: 0n,
      dexLiquidityUsd: 10000n,
      slippageBps: 10n,
      marketStatus: "OPEN",
      nextOpenTime: null,
      lastUpdated: new Date(),
    });

    const engine = new PolicyEngine(signalEngine);
    const result = engine.checkTrade(defaultPolicy, validTrade);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("HALT_SIGNAL_ACTIVE");
  });

  it("rejects trade exceeding maxTradeNotionalUsd", () => {
    const engine = new PolicyEngine();
    const largeTrade = { ...validTrade, amountUsd: parseToFixed18("15") }; // $15 > $10
    const result = engine.checkTrade(defaultPolicy, largeTrade);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("MAX_TRADE_EXCEEDED");
  });

  it("rejects trade exceeding maxSlippageBps", () => {
    const engine = new PolicyEngine();
    const highSlipTrade = { ...validTrade, expectedSlippageBps: 150n }; // 150 bps > 100 bps
    const result = engine.checkTrade(defaultPolicy, highSlipTrade);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("MAX_SLIPPAGE_EXCEEDED");
  });

  it("enforces cooldown period between trades", () => {
    const engine = new PolicyEngine();
    const now = 1000000;

    // First trade executes at t = now
    engine.recordTradeExecution(defaultPolicy.userId, validTrade.amountUsd, now);

    // Second trade attempted at t = now + 30s (cooldown is 60s)
    const result = engine.checkTrade(defaultPolicy, validTrade, now + 30_000);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("COOLDOWN_ACTIVE");

    // Third trade attempted at t = now + 65s (cooldown elapsed)
    const resultAfterCooldown = engine.checkTrade(defaultPolicy, validTrade, now + 65_000);
    expect(resultAfterCooldown.allowed).toBe(true);
  });

  it("enforces daily limit and resets after 24 hours", () => {
    const engine = new PolicyEngine();
    const now = 1000000;

    // Execute $48 out of $50 daily limit
    engine.recordTradeExecution(defaultPolicy.userId, parseToFixed18("48"), now);

    // Attempting $5 trade should fail (48 + 5 = 53 > 50)
    const result = engine.checkTrade(defaultPolicy, validTrade, now + 100_000);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("DAILY_LIMIT_EXCEEDED");

    // 25 hours later (25 * 3600 * 1000 = 90,000,000 ms)
    const nextDayTime = now + 90_000_000;
    const resultNextDay = engine.checkTrade(defaultPolicy, validTrade, nextDayTime);
    expect(resultNextDay.allowed).toBe(true);
  });

  it("enforces allowed tokens whitelist", () => {
    const engine = new PolicyEngine();
    const unallowedTrade = { ...validTrade, tokenAddress: "0xUnknownToken" };
    const result = engine.checkTrade(defaultPolicy, unallowedTrade);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("POLICY_LIMIT");
  });
});
