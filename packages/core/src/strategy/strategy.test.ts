// packages/core/src/strategy/strategy.test.ts

import { describe, it, expect } from "vitest";
import { parseToFixed18 } from "../normalize/fixed-point.js";
import { STRATEGY_TEMPLATES, customizeTemplate } from "./templates.js";
import { StrategyValidator } from "./validator.js";
import { NLStrategyCompiler } from "./compiler.js";
import { StrategySimulator } from "./simulator.js";
import { NormalizationEngine } from "../normalize/engine.js";
import { DataIngestionService, MockRwaDataProvider } from "../services/data-ingestion.js";
import { CompositeTradFiClient, YFinanceClient } from "../services/tradfi.js";
import { FlowAggregator } from "../flow/aggregator.js";
import { MockBscScanProvider } from "../flow/bscscan.js";
import type { ExecutionPolicy } from "../types/policy.js";

describe("Strategy Forge Layer (Module 2)", () => {
  describe("Pre-built Strategy Templates", () => {
    it("contains 4 canonical templates matching Spectra.md §7.7", () => {
      expect(STRATEGY_TEMPLATES.length).toBe(4);
      const ids = STRATEGY_TEMPLATES.map((t) => t.id);
      expect(ids).toContain("dca-weekly");
      expect(ids).toContain("basis-rotation");
      expect(ids).toContain("oracle-divergence-halt");
      expect(ids).toContain("weekend-premium-fade");
    });

    it("validates all 4 default templates as syntactically correct", () => {
      for (const tpl of STRATEGY_TEMPLATES) {
        const res = StrategyValidator.validate(tpl.dsl);
        expect(res.valid).toBe(true);
        expect(res.errors).toEqual([]);
      }
    });

    it("customizes template with ticker, amount, and platform", () => {
      const customized = customizeTemplate("basis-rotation", {
        ticker: "NVDA",
        amountUsd: parseToFixed18("25"),
      });

      expect(customized).not.toBeNull();
      expect(customized?.name).toContain("NVDA");
      expect(customized?.dsl.action).toHaveProperty("ticker", "NVDA");
      expect(customized?.dsl.policy.maxTradeNotionalUsd).toBe(parseToFixed18("25"));
    });
  });

  describe("StrategyValidator", () => {
    it("validates a compliant strategy DSL", () => {
      const dsl = STRATEGY_TEMPLATES[0]!.dsl;
      const res = StrategyValidator.validate(dsl);
      expect(res.valid).toBe(true);
      expect(res.errors).toEqual([]);
    });

    it("catches invalid platform and zero trade amount", () => {
      const res = StrategyValidator.validate({
        name: "Broken Strategy",
        trigger: { type: "MARKET_OPENS" },
        action: {
          type: "BUY",
          ticker: "AAPL",
          platform: "UNKNOWN" as unknown as "ONDO",
          amountUsd: 0n,
        },
        policy: {},
      });

      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThanOrEqual(2);
    });

    it("enforces ExecutionPolicy constraints (trade notional limit & kill switch)", () => {
      const policy: ExecutionPolicy = {
        userId: "user-1",
        maxTradeNotionalUsd: parseToFixed18("10"),
        maxSlippageBps: 100n,
        cooldownSeconds: 300,
        dailyLimitUsd: parseToFixed18("100"),
        allowedTokens: [],
        killSwitch: false,
      };

      const highValueDsl = {
        name: "High Value Trade",
        trigger: { type: "MARKET_OPENS" },
        action: {
          type: "BUY" as const,
          ticker: "AAPL",
          platform: "ONDO" as const,
          amountUsd: parseToFixed18("50"), // Exceeds $10 policy limit!
        },
        policy: {},
      };

      const res = StrategyValidator.validate(highValueDsl, policy);
      expect(res.policyCompliant).toBe(false);
      expect(res.policyViolations.some((v) => v.includes("exceeds policy max notional"))).toBe(true);

      // Kill switch check
      const killSwitchPolicy = { ...policy, killSwitch: true };
      const resKill = StrategyValidator.validate(STRATEGY_TEMPLATES[0]!.dsl, killSwitchPolicy);
      expect(resKill.policyCompliant).toBe(false);
      expect(resKill.policyViolations.some((v) => v.includes("kill switch"))).toBe(true);
    });
  });

  describe("NLStrategyCompiler", () => {
    it("compiles worked example from Spectra.md §7.4 into composite AND StrategyDSL", () => {
      const prompt =
        "Rotate my Ondo AAPL to bStocks AAPL whenever the cross-platform basis exceeds 20 bps and Flow Radar shows net accumulation above $5,000. Max trade $10, max slippage 1%.";

      const dsl = NLStrategyCompiler.compile(prompt);

      expect(dsl.name).toContain("AAPL Basis Rotation");
      expect(dsl.action.type).toBe("ROTATE");
      if (dsl.action.type === "ROTATE") {
        expect(dsl.action.ticker).toBe("AAPL");
        expect(dsl.action.fromPlatform).toBe("ONDO");
        expect(dsl.action.toPlatform).toBe("BSTOCKS");
      }

      expect("conditions" in dsl.trigger).toBe(true);
      if ("conditions" in dsl.trigger) {
        expect(dsl.trigger.type).toBe("AND");
        expect(dsl.trigger.conditions.length).toBe(2);
      }

      expect(dsl.policy.maxTradeNotionalUsd).toBe(parseToFixed18("10"));
      expect(dsl.policy.maxSlippageBps).toBe(100n);

      // Verify the compiled DSL passes validator
      const validation = StrategyValidator.validate(dsl);
      expect(validation.valid).toBe(true);
    });

    it("compiles Weekly DCA prompt into time-scheduled BUY strategy", () => {
      const prompt = "Buy $20 of TSLA on Ondo every Monday with max trade $20 and max slippage 2%";
      const dsl = NLStrategyCompiler.compile(prompt);

      expect(dsl.action.type).toBe("BUY");
      if (dsl.action.type === "BUY") {
        expect(dsl.action.ticker).toBe("TSLA");
        expect(dsl.action.amountUsd).toBe(parseToFixed18("20"));
        expect(dsl.action.platform).toBe("ONDO");
      }

      if ("type" in dsl.trigger && dsl.trigger.type === "TIME_SCHEDULE") {
        expect(dsl.trigger.cron).toBe("0 13 * * 1");
      }

      expect(dsl.policy.maxSlippageBps).toBe(200n);
    });
  });

  describe("StrategySimulator", () => {
    it("simulates strategy dry run, computes fees, and generates SHA-256 simulationHash", async () => {
      const ingestion = new DataIngestionService(new MockRwaDataProvider());
      const tradfi = new CompositeTradFiClient(new YFinanceClient(), new YFinanceClient());
      const normalization = new NormalizationEngine(ingestion, tradfi);
      const flowAggregator = new FlowAggregator(new MockBscScanProvider());

      const simulator = new StrategySimulator(normalization, flowAggregator);
      const basisStrategy = STRATEGY_TEMPLATES.find((t) => t.id === "basis-rotation")!.dsl;

      const result = await simulator.simulate(basisStrategy);

      expect(result.strategyName).toBe(basisStrategy.name);
      expect(typeof result.simulatedPriceUsd).toBe("bigint");
      expect(result.estimatedFeeUsd).toBeGreaterThan(0n);
      expect(result.netAmountOutUsd).toBeGreaterThan(0n);
      expect(result.simulationHash).toBeDefined();
      expect(result.simulationHash.length).toBe(64); // SHA-256 hex string
      expect(result.status).toBe("SUCCESS");
      expect(result.policyCheckPassed).toBe(true);
    });

    it("blocks simulation with BLOCKED_BY_POLICY when policy constraints violated", async () => {
      const ingestion = new DataIngestionService(new MockRwaDataProvider());
      const tradfi = new CompositeTradFiClient(new YFinanceClient(), new YFinanceClient());
      const normalization = new NormalizationEngine(ingestion, tradfi);

      const simulator = new StrategySimulator(normalization);
      const dsl = {
        ...STRATEGY_TEMPLATES[0]!.dsl,
        action: {
          type: "BUY" as const,
          ticker: "AAPL",
          platform: "ONDO" as const,
          amountUsd: parseToFixed18("500"), // Exceeds $10 limit
        },
      };

      const strictPolicy: ExecutionPolicy = {
        userId: "test-user",
        maxTradeNotionalUsd: parseToFixed18("10"),
        maxSlippageBps: 100n,
        cooldownSeconds: 300,
        dailyLimitUsd: parseToFixed18("50"),
        allowedTokens: [],
        killSwitch: false,
      };

      const result = await simulator.simulate(dsl, strictPolicy);
      expect(result.status).toBe("BLOCKED_BY_POLICY");
      expect(result.policyCheckPassed).toBe(false);
    });
  });
});
