// packages/ui/src/Simulator.tsx
//
// Module 2: Strategy Simulator Results Component
// Displays dry-run execution results and SHA-256 simulationHash.
// Reference: Spectra.md §7.1, §7.3

import React from "react";

export interface SimulationResultView {
  strategyName: string;
  triggered: boolean;
  triggerReason: string;
  simulatedPriceUsd: string;
  estimatedSlippageBps: string;
  estimatedFeeUsd: string;
  netAmountOutUsd: string;
  simulationHash: string;
  timestamp: string;
  status: "SUCCESS" | "BLOCKED_BY_POLICY" | "NOT_TRIGGERED";
  policyCheckPassed: boolean;
}

export interface SimulatorProps {
  result: SimulationResultView | null;
  isSimulating?: boolean;
}

function formatDollars(valueStr: string): string {
  const parts = valueStr.split(".");
  const whole = (parts[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = parts[1] ? parts[1].slice(0, 2) : "00";
  return `$${whole}.${cents}`;
}

export const Simulator: React.FC<SimulatorProps> = ({ result, isSimulating = false }) => {
  if (isSimulating) {
    return (
      <div
        data-testid="simulator-loading"
        style={{
          backgroundColor: "#181A20",
          border: "1px solid #2B313A",
          borderRadius: "16px",
          padding: "24px",
          textAlign: "center",
          color: "#F0B90B",
          fontSize: "14px",
        }}
      >
        Running dry-run simulation against live market feeds & DEX liquidity depth...
      </div>
    );
  }

  if (!result) {
    return (
      <div
        style={{
          backgroundColor: "#181A20",
          border: "1px solid #2B313A",
          borderRadius: "16px",
          padding: "24px",
          textAlign: "center",
          color: "#848E9C",
          fontSize: "13px",
        }}
      >
        Click "Run Dry-Run Simulation" to backtest against current market prices and policy constraints.
      </div>
    );
  }

  const isSuccess = result.status === "SUCCESS";
  const isBlocked = result.status === "BLOCKED_BY_POLICY";

  return (
    <div
      style={{
        backgroundColor: "#181A20",
        border: "1px solid #2B313A",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#EAECEF" }}>
          🧪 Dry-Run Simulation Output
        </h3>
        <span
          data-testid="simulation-status-badge"
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "4px",
            backgroundColor: isSuccess ? "#0C382A" : isBlocked ? "#3D1A24" : "#2B2414",
            color: isSuccess ? "#0ECB81" : isBlocked ? "#F6465D" : "#F0B90B",
          }}
        >
          {result.status}
        </span>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div style={{ backgroundColor: "#20252E", padding: "12px", borderRadius: "6px" }}>
          <div style={{ fontSize: "11px", color: "#848E9C", marginBottom: "4px" }}>Trigger Evaluation</div>
          <div
            data-testid="trigger-status"
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: result.triggered ? "#0ECB81" : "#F0B90B",
            }}
          >
            {result.triggered ? "Trigger Fired ✓" : "Pending Trigger ⏳"}
          </div>
          <div style={{ fontSize: "11px", color: "#848E9C", marginTop: "2px" }}>
            {result.triggerReason}
          </div>
        </div>

        <div style={{ backgroundColor: "#20252E", padding: "12px", borderRadius: "6px" }}>
          <div style={{ fontSize: "11px", color: "#848E9C", marginBottom: "4px" }}>Simulated Price</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#EAECEF", fontFamily: "JetBrains Mono, monospace" }}>
            {formatDollars(result.simulatedPriceUsd)}
          </div>
          <div style={{ fontSize: "11px", color: "#848E9C", marginTop: "2px" }}>
            Estimated Slippage: {result.estimatedSlippageBps} bps
          </div>
        </div>

        <div style={{ backgroundColor: "#20252E", padding: "12px", borderRadius: "6px" }}>
          <div style={{ fontSize: "11px", color: "#848E9C", marginBottom: "4px" }}>Net Notional Out</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0ECB81", fontFamily: "JetBrains Mono, monospace" }}>
            {formatDollars(result.netAmountOutUsd)}
          </div>
          <div style={{ fontSize: "11px", color: "#848E9C", marginTop: "2px" }}>
            Estimated Fee: {formatDollars(result.estimatedFeeUsd)}
          </div>
        </div>

        <div style={{ backgroundColor: "#20252E", padding: "12px", borderRadius: "6px" }}>
          <div style={{ fontSize: "11px", color: "#848E9C", marginBottom: "4px" }}>Policy Check</div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: result.policyCheckPassed ? "#0ECB81" : "#F6465D",
            }}
          >
            {result.policyCheckPassed ? "Constraints Pass ✓" : "Policy Violated ✗"}
          </div>
          <div style={{ fontSize: "11px", color: "#848E9C", marginTop: "2px" }}>
            Vault bounds respected
          </div>
        </div>
      </div>

      {/* Cryptographic Hash Anchoring */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          backgroundColor: "#14151A",
          border: "1px solid #2B313A",
          borderRadius: "6px",
          fontSize: "12px",
        }}
      >
        <span style={{ color: "#848E9C" }}>Cryptographic SHA-256 Simulation Hash:</span>
        <span
          data-testid="simulation-hash"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            color: "#F0B90B",
            fontWeight: 600,
          }}
        >
          {`${result.simulationHash.slice(0, 10)}...${result.simulationHash.slice(-8)}`}
        </span>
      </div>
    </div>
  );
};
