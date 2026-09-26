// apps/backend/src/forge.ts
//
// Module 2: Strategy Forge router (/api/forge/*)
// Reference: Spectra.md §7.2, §7.3, §7.7

import { Router, type Request, type Response } from "express";
import type { BackendServices } from "./app.js";
import {
  STRATEGY_TEMPLATES,
  StrategyValidator,
  NLStrategyCompiler,
  StrategySimulator,
  formatFixed18,
  parseToFixed18,
  type StrategyDSL,
  type DeployedStrategy,
  type StrategyExecutionRecord,
  type ExecutionPolicy,
  type SimulationResult,
} from "@spectra/core";

// In-memory deployed strategies and executions store for development/demo
const deployedStrategies = new Map<string, DeployedStrategy>();
const executionHistory: StrategyExecutionRecord[] = [
  {
    id: "exec-1",
    strategyId: "strat-basis-aapl",
    strategyName: "AAPL Basis Rotation",
    timestamp: new Date(Date.now() - 3600 * 1000),
    actionType: "ROTATE",
    ticker: "AAPL",
    platform: "ONDO",
    amountUsd: parseToFixed18("10"),
    receiptHash: "0x89ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345678",
    status: "CONFIRMED",
    txHash: "0x78ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345679",
  },
  {
    id: "exec-2",
    strategyId: "strat-dca-tsla",
    strategyName: "Weekly DCA (TSLA)",
    timestamp: new Date(Date.now() - 24 * 3600 * 1000),
    actionType: "BUY",
    ticker: "TSLA",
    platform: "ONDO",
    amountUsd: parseToFixed18("10"),
    receiptHash: "0x45cd12ab34ef567890abcdef1234567890abcdef1234567890abcdef12345678",
    status: "CONFIRMED",
    txHash: "0x34ef12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345679",
  },
];

export function serializeDsl(dsl: StrategyDSL) {
  return JSON.parse(
    JSON.stringify(dsl, (_k, v) => (typeof v === "bigint" ? formatFixed18(v) : v)),
  );
}

export function serializeSimulation(sim: SimulationResult) {
  return {
    strategyName: sim.strategyName,
    triggered: sim.triggered,
    triggerReason: sim.triggerReason,
    action: JSON.parse(
      JSON.stringify(sim.action, (_k, v) => (typeof v === "bigint" ? formatFixed18(v) : v)),
    ),
    simulatedPriceUsd: formatFixed18(sim.simulatedPriceUsd),
    estimatedSlippageBps: sim.estimatedSlippageBps.toString(),
    estimatedFeeUsd: formatFixed18(sim.estimatedFeeUsd),
    netAmountOutUsd: formatFixed18(sim.netAmountOutUsd),
    simulationHash: sim.simulationHash,
    timestamp: sim.timestamp.toISOString(),
    status: sim.status,
    policyCheckPassed: sim.policyCheckPassed,
  };
}

export function serializeDeployedStrategy(strat: DeployedStrategy) {
  return {
    id: strat.id,
    name: strat.name,
    dsl: serializeDsl(strat.dsl),
    userId: strat.userId,
    status: strat.status,
    createdAt: strat.createdAt.toISOString(),
    lastExecutedAt: strat.lastExecutedAt?.toISOString(),
    executionCount: strat.executionCount,
    totalVolumeUsd: formatFixed18(strat.totalVolumeUsd),
    agentIdentity: strat.agentIdentity,
  };
}

export function serializeExecutionRecord(rec: StrategyExecutionRecord) {
  return {
    id: rec.id,
    strategyId: rec.strategyId,
    strategyName: rec.strategyName,
    timestamp: rec.timestamp.toISOString(),
    actionType: rec.actionType,
    ticker: rec.ticker,
    platform: rec.platform,
    amountUsd: formatFixed18(rec.amountUsd),
    receiptHash: rec.receiptHash,
    status: rec.status,
    txHash: rec.txHash,
  };
}

export function createForgeRouter(services: BackendServices): Router {
  const router = Router();
  const simulator = new StrategySimulator(services.normalization, services.flowAggregator);

  // GET /api/forge/templates (§7.7)
  router.get("/templates", (_req: Request, res: Response) => {
    try {
      const templates = STRATEGY_TEMPLATES.map((tpl) => ({
        id: tpl.id,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        defaultTicker: tpl.defaultTicker,
        estimatedApyBps: tpl.estimatedApyBps,
        dsl: serializeDsl(tpl.dsl),
      }));

      res.json({
        count: templates.length,
        data: templates,
      });
    } catch {
      res.status(500).json({ error: "Failed to load strategy templates" });
    }
  });

  // POST /api/forge/compile (§7.3, §7.4)
  router.post("/compile", (req: Request, res: Response) => {
    try {
      const prompt = req.body?.prompt;
      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Prompt string is required" });
        return;
      }

      const dsl = NLStrategyCompiler.compile(prompt);
      const validation = StrategyValidator.validate(dsl);

      res.json({
        prompt,
        dsl: serializeDsl(dsl),
        validation,
      });
    } catch {
      res.status(500).json({ error: "Failed to compile natural language strategy" });
    }
  });

  // POST /api/forge/validate (§7.3)
  router.post("/validate", (req: Request, res: Response) => {
    try {
      const rawDsl = req.body?.dsl;
      if (!rawDsl) {
        res.status(400).json({ error: "Strategy DSL object is required" });
        return;
      }

      // Rehydrate BigInt fields in DSL if passed as strings
      const dsl: StrategyDSL = {
        name: rawDsl.name,
        trigger: rawDsl.trigger,
        action: rawDsl.action,
        policy: {
          maxTradeNotionalUsd: rawDsl.policy?.maxTradeNotionalUsd ? parseToFixed18(rawDsl.policy.maxTradeNotionalUsd) : undefined,
          maxSlippageBps: rawDsl.policy?.maxSlippageBps ? BigInt(rawDsl.policy.maxSlippageBps) : undefined,
          cooldownSeconds: rawDsl.policy?.cooldownSeconds,
        },
      };

      if ("amountUsd" in dsl.action && typeof dsl.action.amountUsd === "string") {
        dsl.action.amountUsd = parseToFixed18(dsl.action.amountUsd);
      }

      const validation = StrategyValidator.validate(dsl);
      res.json(validation);
    } catch {
      res.status(500).json({ error: "Failed to validate strategy" });
    }
  });

  // POST /api/forge/simulate (§7.1, §7.3)
  router.post("/simulate", async (req: Request, res: Response) => {
    try {
      const rawDsl = req.body?.dsl;
      if (!rawDsl) {
        res.status(400).json({ error: "Strategy DSL object is required" });
        return;
      }

      const dsl: StrategyDSL = {
        name: rawDsl.name,
        trigger: rawDsl.trigger,
        action: rawDsl.action,
        policy: {
          maxTradeNotionalUsd: rawDsl.policy?.maxTradeNotionalUsd ? parseToFixed18(rawDsl.policy.maxTradeNotionalUsd) : undefined,
          maxSlippageBps: rawDsl.policy?.maxSlippageBps ? BigInt(rawDsl.policy.maxSlippageBps) : undefined,
          cooldownSeconds: rawDsl.policy?.cooldownSeconds,
        },
      };

      if ("amountUsd" in dsl.action && typeof dsl.action.amountUsd === "string") {
        dsl.action.amountUsd = parseToFixed18(dsl.action.amountUsd);
      }

      const rawPolicy = req.body?.policy;
      let policy: ExecutionPolicy | undefined;
      if (rawPolicy) {
        policy = {
          userId: rawPolicy.userId || "user-default",
          maxTradeNotionalUsd: parseToFixed18(rawPolicy.maxTradeNotionalUsd || "10"),
          maxSlippageBps: BigInt(rawPolicy.maxSlippageBps || "100"),
          cooldownSeconds: rawPolicy.cooldownSeconds || 300,
          dailyLimitUsd: parseToFixed18(rawPolicy.dailyLimitUsd || "100"),
          allowedTokens: rawPolicy.allowedTokens || [],
          killSwitch: Boolean(rawPolicy.killSwitch),
        };
      }

      const simulation = await simulator.simulate(dsl, policy);
      res.json(serializeSimulation(simulation));
    } catch {
      res.status(500).json({ error: "Failed to simulate strategy execution" });
    }
  });

  // POST /api/forge/deploy (§7.1, §9.1)
  router.post("/deploy", (req: Request, res: Response) => {
    try {
      const rawDsl = req.body?.dsl;
      const userId = req.body?.userId || "user-default";

      if (!rawDsl) {
        res.status(400).json({ error: "Strategy DSL object is required" });
        return;
      }

      const dsl: StrategyDSL = {
        name: rawDsl.name || "Custom Strategy",
        trigger: rawDsl.trigger,
        action: rawDsl.action,
        policy: {
          maxTradeNotionalUsd: rawDsl.policy?.maxTradeNotionalUsd ? parseToFixed18(rawDsl.policy.maxTradeNotionalUsd) : parseToFixed18("10"),
          maxSlippageBps: rawDsl.policy?.maxSlippageBps ? BigInt(rawDsl.policy.maxSlippageBps) : 100n,
          cooldownSeconds: rawDsl.policy?.cooldownSeconds || 300,
        },
      };

      if ("amountUsd" in dsl.action && typeof dsl.action.amountUsd === "string") {
        dsl.action.amountUsd = parseToFixed18(dsl.action.amountUsd);
      }

      const validation = StrategyValidator.validate(dsl);
      if (!validation.valid) {
        res.status(400).json({ error: "Invalid strategy", details: validation.errors });
        return;
      }

      const id = `strat-${Date.now()}`;
      const deployed: DeployedStrategy = {
        id,
        name: dsl.name,
        dsl,
        userId,
        status: "ACTIVE",
        createdAt: new Date(),
        executionCount: 0,
        totalVolumeUsd: 0n,
        policy: {
          userId,
          maxTradeNotionalUsd: dsl.policy.maxTradeNotionalUsd ?? parseToFixed18("10"),
          maxSlippageBps: dsl.policy.maxSlippageBps ?? 100n,
          cooldownSeconds: dsl.policy.cooldownSeconds ?? 300,
          dailyLimitUsd: parseToFixed18("100"),
          allowedTokens: [],
          killSwitch: false,
        },
        agentIdentity: `erc8004:bsc:agent-${id.slice(-6)}`,
      };

      deployedStrategies.set(id, deployed);

      res.json({
        success: true,
        message: "Strategy deployed to BNB Agent Studio runtime",
        strategy: serializeDeployedStrategy(deployed),
      });
    } catch {
      res.status(500).json({ error: "Failed to deploy strategy" });
    }
  });

  // GET /api/forge/strategies (§7.6)
  router.get("/strategies", (req: Request, res: Response) => {
    try {
      const rawUser = req.query.userId;
      const userId = typeof rawUser === "string" ? rawUser : undefined;

      let list = Array.from(deployedStrategies.values());
      if (userId) {
        list = list.filter((s) => s.userId === userId);
      }

      res.json({
        count: list.length,
        data: list.map(serializeDeployedStrategy),
      });
    } catch {
      res.status(500).json({ error: "Failed to list deployed strategies" });
    }
  });

  // GET /api/forge/executions (§7.6)
  router.get("/executions", (_req: Request, res: Response) => {
    try {
      res.json({
        count: executionHistory.length,
        data: executionHistory.map(serializeExecutionRecord),
      });
    } catch {
      res.status(500).json({ error: "Failed to list execution history" });
    }
  });

  return router;
}
