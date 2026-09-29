// packages/ui/src/WhaleTable.tsx
// Module 3: Whale Table Component
// High-conviction wallet accumulation and distribution tracking.
// Reference: Spectra.md §8.1, §8.4

import React from "react";

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
          backgroundColor: "rgba(22, 24, 29, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          color: "#848E9C",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        No whale movements detected above threshold ($10,000 USD).
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "rgba(22, 24, 29, 0.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        overflow: "hidden",
        width: "100%",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "rgba(13, 14, 18, 0.4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🐳</span>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#EAECEF" }}>
            Whale Radar Movements (&gt; $10k USD)
          </h3>
        </div>
        <span
          style={{
            fontSize: "11px",
            color: "#F0B90B",
            backgroundColor: "rgba(240, 185, 11, 0.1)",
            padding: "2px 8px",
            borderRadius: "9999px",
            border: "1px solid rgba(240, 185, 11, 0.25)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {alerts.length} events detected
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#848E9C",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.88px",
                textTransform: "uppercase",
                backgroundColor: "rgba(13, 14, 18, 0.3)",
              }}
            >
              <th style={{ padding: "12px 18px" }}>Time</th>
              <th style={{ padding: "12px 18px" }}>Direction</th>
              <th style={{ padding: "12px 18px" }}>Ticker</th>
              <th style={{ padding: "12px 18px" }}>Platform</th>
              <th style={{ padding: "12px 18px" }}>Wallet</th>
              <th style={{ padding: "12px 18px", textAlign: "right" }}>Notional (USD)</th>
              <th style={{ padding: "12px 18px", textAlign: "right" }}>Shares</th>
              <th style={{ padding: "12px 18px", textAlign: "center" }}>Tx</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((row) => {
              const isInflow = row.direction === "INFLOW";
              const timeDisplay = row.timestamp.includes("T")
                ? row.timestamp.split("T")[1]?.slice(0, 5) ?? row.timestamp
                : row.timestamp;

              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    color: "#FFFFFF",
                    transition: "background-color 0.15s ease",
                  }}
                  className="hover:bg-white/[0.03]"
                >
                  <td style={{ padding: "12px 18px", color: "#848E9C", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                    {timeDisplay}
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: isInflow ? "rgba(14, 203, 129, 0.12)" : "rgba(246, 70, 93, 0.12)",
                        border: `1px solid ${isInflow ? "rgba(14, 203, 129, 0.3)" : "rgba(246, 70, 93, 0.3)"}`,
                        color: isInflow ? "#0ECB81" : "#F6465D",
                      }}
                    >
                      {isInflow ? "▲ INFLOW" : "▼ OUTFLOW"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <button
                      onClick={() => onSelectTicker?.(row.ticker)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#F0B90B",
                        fontWeight: 700,
                        cursor: onSelectTicker ? "pointer" : "default",
                        padding: 0,
                        fontSize: "14px",
                      }}
                      className="hover:underline"
                    >
                      {row.ticker}
                    </button>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#848E9C",
                      }}
                    >
                      {row.platform}
                    </span>
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span
                      onClick={() => onSelectWallet?.(row.wallet)}
                      style={{
                        color: onSelectWallet ? "#F0B90B" : "#EAECEF",
                        cursor: onSelectWallet ? "pointer" : "default",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "12px",
                      }}
                    >
                      {row.walletLabel}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      color: isInflow ? "#0ECB81" : "#F6465D",
                    }}
                  >
                    {isInflow ? `+${formatDollars(row.amountUsd)}` : `-${formatDollars(row.amountUsd)}`}
                  </td>
                  <td style={{ padding: "12px 18px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#848E9C" }}>
                    {formatTokens(row.amountTokens)}
                  </td>
                  <td style={{ padding: "12px 18px", textAlign: "center" }}>
                    <a
                      href={`https://bscscan.com/tx/${row.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0D74CE",
                        textDecoration: "none",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(13, 116, 206, 0.1)",
                      }}
                      className="hover:bg-blue-500/20"
                    >
                      {row.hash.slice(0, 6)}...
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
