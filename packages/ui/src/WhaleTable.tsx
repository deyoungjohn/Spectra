// packages/ui/src/WhaleTable.tsx
//
// Module 3: Whale Table Component
// High-conviction wallet accumulation and distribution tracking.
// Reference: Spectra.md §8.1, §8.4

import React from "react";
import { AnimatedBadge } from "./motion/AnimatedBadge.js";

export interface WhaleAlertRow {
  id: string;
  hash: string;
  timestamp: string;
  ticker: string;
  platform: string;
  wallet: string;
  walletLabel: string;
  direction: "INFLOW" | "OUTFLOW";
  amountTokens: string;
  amountUsd: string;
}

export interface WhaleTableProps {
  alerts: WhaleAlertRow[];
  onSelectWallet?: (wallet: string) => void;
  onSelectTicker?: (ticker: string) => void;
}

function formatDollars(valueStr: string): string {
  const parts = valueStr.split(".");
  const whole = (parts[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = parts[1] ? parts[1].slice(0, 2) : "00";
  return `$${whole}.${cents}`;
}

function formatTokens(valueStr: string): string {
  const parts = valueStr.split(".");
  const whole = (parts[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimals = parts[1] ? parts[1].slice(0, 2) : "00";
  return `${whole}.${decimals}`;
}

export const WhaleTable: React.FC<WhaleTableProps> = ({
  alerts,
  onSelectWallet,
  onSelectTicker,
}) => {
  if (alerts.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#181A20",
          border: "1px solid #2B313A",
          borderRadius: "8px",
          padding: "24px",
          textAlign: "center",
          color: "#848E9C",
          fontSize: "14px",
        }}
      >
        No whale movements detected above threshold ($10,000 USD).
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#181A20",
        border: "1px solid #2B313A",
        borderRadius: "16px",
        overflow: "hidden",
        width: "100%",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
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
          🐳 Whale Radar Movements (&gt; $10k USD)
        </h3>
        <span style={{ fontSize: "12px", color: "#848E9C" }}>{alerts.length} events detected</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "#20252E", color: "#848E9C", borderBottom: "1px solid #2B313A" }}>
              <th style={{ padding: "10px 16px" }}>Time</th>
              <th style={{ padding: "10px 16px" }}>Direction</th>
              <th style={{ padding: "10px 16px" }}>Ticker</th>
              <th style={{ padding: "10px 16px" }}>Platform</th>
              <th style={{ padding: "10px 16px" }}>Wallet</th>
              <th style={{ padding: "10px 16px", textAlign: "right" }}>Notional (USD)</th>
              <th style={{ padding: "10px 16px", textAlign: "right" }}>Shares</th>
              <th style={{ padding: "10px 16px", textAlign: "right" }}>Tx Hash</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((row) => {
              const isInflow = row.direction === "INFLOW";
              const timeDisplay = row.timestamp.includes("T")
                ? row.timestamp.split("T")[1]?.slice(0, 8) || row.timestamp
                : row.timestamp;

              return (
                <tr
                  key={row.id}
                  data-testid={`whale-row-${row.id}`}
                  style={{
                    borderBottom: "1px solid #20252E",
                  }}
                >
                  <td style={{ padding: "12px 16px", color: "#848E9C", fontFamily: "JetBrains Mono, monospace" }}>
                    {timeDisplay}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <AnimatedBadge label={row.direction} status={isInflow ? "success" : "error"} size="sm" />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      onClick={() => onSelectTicker?.(row.ticker)}
                      style={{
                        fontWeight: 700,
                        color: "#EAECEF",
                        cursor: onSelectTicker ? "pointer" : "default",
                      }}
                    >
                      {row.ticker}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <AnimatedBadge label={row.platform} status="neutral" size="sm" />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      onClick={() => onSelectWallet?.(row.wallet)}
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        color: "#F0B90B",
                        cursor: onSelectWallet ? "pointer" : "default",
                        fontSize: "12px",
                      }}
                    >
                      {row.walletLabel}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontFamily: "JetBrains Mono, monospace",
                      fontWeight: 700,
                      color: isInflow ? "#0ECB81" : "#F6465D",
                    }}
                  >
                    {isInflow ? `+${formatDollars(row.amountUsd)}` : `-${formatDollars(row.amountUsd)}`}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", color: "#EAECEF" }}>
                    {formatTokens(row.amountTokens)}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <a
                      href={`https://bscscan.com/tx/${row.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "11px",
                        color: "#848E9C",
                        textDecoration: "none",
                      }}
                    >
                      {`${row.hash.slice(0, 6)}...${row.hash.slice(-4)}`} ↗
                    </a>
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
