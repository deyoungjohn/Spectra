// apps/web/src/app/forge/page.tsx
"use client";

import React, { useState } from "react";
import {
  TemplateGallery,
  NLInput,
  StrategyPreview,
  Simulator,
  ExecutionLog,
  type SimulationResultView,
  type ExecutionRecordView,
} from "@spectra/ui";

const DEFAULT_TEMPLATES = [
  {
    id: "dca-weekly",
    name: "Weekly DCA",
    description: "Buy $X of a tokenized stock every Monday at US market open",
    category: "DCA",
    defaultTicker: "AAPL",
    estimatedApyBps: 850,
  },
  {
    id: "basis-rotation",
    name: "Cross-Platform Basis Rotation",
    description: "Rotate between Ondo and bStocks when basis exceeds 20 bps net",
    category: "ARBITRAGE",
    defaultTicker: "AAPL",
    estimatedApyBps: 1420,
  },
  {
    id: "oracle-divergence-halt",
    name: "Oracle Divergence Guard",
    description: "Emit alert and pause trading if on-chain price diverges > 25 bps from TradFi",
    category: "GUARD",
    defaultTicker: "AAPL",
  },
  {
    id: "weekend-premium-fade",
    name: "Weekend Premium Fade",
    description: "Take profit when weekend sentiment premium exceeds 150 bps",
    category: "TACTICAL",
    defaultTicker: "AAPL",
    estimatedApyBps: 650,
  },
];

const INITIAL_DSL = {
  name: "AAPL Basis Rotation",
  trigger: {
    type: "AND",
    conditions: [
      { type: "CROSS_PLATFORM_BASIS_ABOVE", ticker: "AAPL", basisBps: "20" },
      { type: "FLOW_ACCUMULATION_ABOVE", ticker: "AAPL", usdAmount: "5000.00" },
    ],
  },
  action: {
    type: "ROTATE",
    ticker: "AAPL",
    fromPlatform: "ONDO",
    toPlatform: "BSTOCKS",
  },
  policy: {
    maxTradeNotionalUsd: "10.00",
    maxSlippageBps: "100",
    cooldownSeconds: 300,
  },
};

const INITIAL_EXECUTIONS: ExecutionRecordView[] = [
  {
    id: "exec-1",
    strategyId: "strat-basis-aapl",
    strategyName: "AAPL Basis Rotation",
    timestamp: "2026-09-26T21:15:00Z",
    actionType: "ROTATE",
    ticker: "AAPL",
    platform: "ONDO",
    amountUsd: "10.00",
    receiptHash: "0x89ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345678",
    status: "CONFIRMED",
    txHash: "0x78ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345679",
  },
  {
    id: "exec-2",
    strategyId: "strat-dca-tsla",
    strategyName: "Weekly DCA (TSLA)",
    timestamp: "2026-09-26T13:00:00Z",
    actionType: "BUY",
    ticker: "TSLA",
    platform: "ONDO",
    amountUsd: "10.00",
    receiptHash: "0x45cd12ab34ef567890abcdef1234567890abcdef1234567890abcdef12345678",
    status: "CONFIRMED",
    txHash: "0x34ef12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345679",
  },
];

export default function StrategyForgePage() {
  const [dsl, setDsl] = useState<Record<string, unknown>>(INITIAL_DSL);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("basis-rotation");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResultView | null>(null);
  const [deployedAlert, setDeployedAlert] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === "dca-weekly") {
      setDsl({
        name: "Weekly DCA (AAPL)",
        trigger: { type: "TIME_SCHEDULE", cron: "0 13 * * 1" },
        action: { type: "BUY", ticker: "AAPL", platform: "ONDO", amountUsd: "10.00" },
        policy: { maxTradeNotionalUsd: "10.00", maxSlippageBps: "100", cooldownSeconds: 0 },
      });
    } else if (templateId === "basis-rotation") {
      setDsl(INITIAL_DSL);
    } else if (templateId === "oracle-divergence-halt") {
      setDsl({
        name: "Oracle Divergence Guard",
        trigger: { type: "ORACLE_DIVERGENCE_ABOVE", ticker: "AAPL", divergenceBps: "25" },
        action: { type: "ALERT", channel: "telegram", message: "Oracle divergence > 25 bps detected on AAPL" },
        policy: { maxTradeNotionalUsd: "0.00", maxSlippageBps: "0", cooldownSeconds: 60 },
      });
    } else if (templateId === "weekend-premium-fade") {
      setDsl({
        name: "Weekend Premium Fade (AAPL)",
        trigger: { type: "WEEKEND_PREMIUM_ABOVE", ticker: "AAPL", premiumBps: "150" },
        action: { type: "SELL", ticker: "AAPL", platform: "ONDO", amountUsd: "10.00" },
        policy: { maxTradeNotionalUsd: "10.00", maxSlippageBps: "150", cooldownSeconds: 300 },
      });
    }
  };

  const handleCompile = (prompt: string) => {
    setIsCompiling(true);
    // Simple client-side compilation fallback matching backend compiler
    setTimeout(() => {
      const lower = prompt.toLowerCase();
      let ticker = "AAPL";
      if (lower.includes("nvda")) ticker = "NVDA";
      if (lower.includes("tsla")) ticker = "TSLA";
      if (lower.includes("msft")) ticker = "MSFT";

      let action: Record<string, unknown> = {
        type: "BUY",
        ticker,
        platform: "ONDO",
        amountUsd: "10.00",
      };

      if (lower.includes("rotate")) {
        action = {
          type: "ROTATE",
          ticker,
          fromPlatform: "ONDO",
          toPlatform: "BSTOCKS",
        };
      } else if (lower.includes("alert")) {
        action = {
          type: "ALERT",
          channel: "telegram",
          message: prompt,
        };
      }

      setDsl({
        name: `${ticker} Compiled Strategy`,
        trigger: {
          type: "AND",
          conditions: [
            { type: "CROSS_PLATFORM_BASIS_ABOVE", ticker, basisBps: "20" },
            { type: "FLOW_ACCUMULATION_ABOVE", ticker, usdAmount: "5000.00" },
          ],
        },
        action,
        policy: {
          maxTradeNotionalUsd: "10.00",
          maxSlippageBps: "100",
          cooldownSeconds: 300,
        },
      });
      setIsCompiling(false);
    }, 400);
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimulationResult({
        strategyName: String(dsl.name || "Custom Strategy"),
        triggered: true,
        triggerReason: "Basis is 25 bps (threshold: 20 bps) and Flow is $6,200 (threshold: $5,000)",
        simulatedPriceUsd: "334.60",
        estimatedSlippageBps: "15",
        estimatedFeeUsd: "0.03",
        netAmountOutUsd: "9.97",
        simulationHash: "89ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345678",
        timestamp: new Date().toISOString(),
        status: "SUCCESS",
        policyCheckPassed: true,
      });
      setIsSimulating(false);
    }, 500);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      const agentId = `erc8004:bsc:agent-${Date.now().toString().slice(-6)}`;
      setDeployedAlert(`Strategy "${dsl.name}" successfully deployed to BNB Agent Studio runtime! Assigned Identity: ${agentId}`);
      setIsDeploying(false);
    }, 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Title */}
      <div>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#EAECEF" }}>
          Strategy Forge <span style={{ color: "#F0B90B", fontSize: "16px", fontWeight: 600 }}>The Composer Layer</span>
        </h1>
        <p style={{ margin: "6px 0 0", color: "#848E9C", fontSize: "14px" }}>
          Compose algorithmic strategies in natural language or templates, dry-run against live market feeds, and deploy to BNB Agent Studio.
        </p>
      </div>

      {deployedAlert && (
        <div
          data-testid="deployed-alert"
          style={{
            padding: "12px 16px",
            backgroundColor: "#0C382A",
            border: "1px solid #0ECB81",
            borderRadius: "6px",
            color: "#0ECB81",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>🚀 {deployedAlert}</span>
          <button
            type="button"
            onClick={() => setDeployedAlert(null)}
            style={{ background: "none", border: "none", color: "#0ECB81", cursor: "pointer", fontSize: "16px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Template Gallery */}
      <TemplateGallery
        templates={DEFAULT_TEMPLATES}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Natural Language Input */}
      <NLInput
        onCompile={handleCompile}
        isCompiling={isCompiling}
      />

      {/* DSL Preview & Simulator */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
        <StrategyPreview
          dsl={dsl}
          isValid={true}
          isSimulating={isSimulating}
          isDeploying={isDeploying}
          onSimulate={handleSimulate}
          onDeploy={handleDeploy}
        />

        <Simulator
          result={simulationResult}
          isSimulating={isSimulating}
        />
      </div>

      {/* Execution Log */}
      <ExecutionLog executions={INITIAL_EXECUTIONS} />
    </div>
  );
}
