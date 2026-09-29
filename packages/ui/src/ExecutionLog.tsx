// packages/ui/src/ExecutionLog.tsx
//
// Module 2: Strategy Execution Log Component
// Displays past autonomous executions with cryptographic receipt links.
// Reference: Spectra.md §7.6, §5.5, §10.4

import React from "react";

export interface ExecutionRecordView {
  id: string;
  strategyId: string;
  strategyName: string;
  timestamp: string;
  actionType: string;
  ticker: string;
  platform?: string;
  amountUsd: string;
  receiptHash: string;
  status: "CONFIRMED" | "REVERTED" | "SIMULATED";
  txHash?: string;
}

export interface ExecutionLogProps {
  executions: ExecutionRecordView[];
}

function formatDollars(valueStr: string): string {
  const parts = valueStr.split(".");
  const whole = (parts[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = parts[1] ? parts[1].slice(0, 2) : "00";
  return `$${whole}.${cents}`;
}

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ executions }) => {
  if (executions.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#181A20",
          border: "1px solid #2B313A",
          borderRadius: "8px",
          padding: "24px",
          textAlign: "center",
          color: "#848E9C",
          fontSize: "13px",
        }}
      >
        No strategy executions recorded yet. Deployed agents run on-chain through the autonomous runtime.
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#181A20",
        border: "1px solid #2B313A",
        borderRadius: "8px",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #2B313A",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#EAECEF" }}>
          📜 Agent Execution Log & Receipts
        </h3>
        <span style={{ fontSize: "12px", color: "#848E9C" }}>
          Anchored on BNB Chain via ReceiptRegistry.sol
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "#20252E", color: "#848E9C", borderBottom: "1px solid #2B313A" }}>
              <th style={{ padding: "10px 16px" }}>Time</th>
              <th style={{ padding: "10px 16px" }}>Strategy</th>
              <th style={{ padding: "10px 16px" }}>Action</th>
              <th style={{ padding: "10px 16px" }}>Ticker</th>
              <th style={{ padding: "10px 16px", textAlign: "right" }}>Notional</th>
              <th style={{ padding: "10px 16px" }}>Status</th>
              <th style={{ padding: "10px 16px", textAlign: "right" }}>Receipt Hash</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((row) => {
              const isConfirmed = row.status === "CONFIRMED";
              const isReverted = row.status === "REVERTED";

              return (
                <tr
                  key={row.id}
                  data-testid={`exec-row-${row.id}`}
                  style={{ borderBottom: "1px solid #20252E" }}
                >
                  <td style={{ padding: "12px 16px", color: "#848E9C", fontFamily: "JetBrains Mono, monospace" }}>
                    {row.timestamp.split("T")[0]} {row.timestamp.split("T")[1]?.slice(0, 8)}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#EAECEF" }}>
                    {row.strategyName}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: "3px",
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "#2B313A",
                        color: "#F0B90B",
                      }}
                    >
                      {row.actionType}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#EAECEF" }}>
                    {row.ticker}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontFamily: "JetBrains Mono, monospace",
                      fontWeight: 700,
                      color: "#EAECEF",
                    }}
                  >
                    {formatDollars(row.amountUsd)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: isConfirmed ? "#0C382A" : isReverted ? "#3D1A24" : "#2B2414",
                        color: isConfirmed ? "#0ECB81" : isReverted ? "#F6465D" : "#F0B90B",
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "11px",
                        color: "#848E9C",
                      }}
                    >
                      {`${row.receiptHash.slice(0, 8)}...${row.receiptHash.slice(-6)}`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
