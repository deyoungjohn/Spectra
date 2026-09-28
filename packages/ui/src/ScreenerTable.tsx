// packages/ui/src/ScreenerTable.tsx
"use client";

import React from "react";
import { AnimatedButton } from "./motion/AnimatedButton.js";

export interface ScreenerRow {
  ticker: string;
  platform: string;
  tokenAddress: string;
  tokenPrice: string;
  perSharePrice: string;
  tradfiPrice: string;
  oracleDivergenceBps: string;
  weekendPremiumBps: string;
  crossPlatformBasisBps: string;
  dexLiquidityUsd: string;
  slippageBps: string;
  marketStatus: string;
  activeSignalsCount?: number;
}

export interface ScreenerTableProps {
  rows: ScreenerRow[];
  onSelectRow?: (ticker: string) => void;
}

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  rows,
  onSelectRow,
}) => {
  return (
    <div
      style={{
        overflowX: "auto",
        backgroundColor: "#14161C",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#848E9C" }}>
            <th style={{ padding: "14px 18px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>TICKER</th>
            <th style={{ padding: "14px 18px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>PLATFORM</th>
            <th style={{ padding: "14px 18px", textAlign: "right", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>ONCHAIN PER-SHARE</th>
            <th style={{ padding: "14px 18px", textAlign: "right", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>TRADFI ANCHOR</th>
            <th style={{ padding: "14px 18px", textAlign: "right", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>ORACLE DIV</th>
            <th style={{ padding: "14px 18px", textAlign: "right", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>CROSS-BASIS</th>
            <th style={{ padding: "14px 18px", textAlign: "right", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>DEX LIQUIDITY</th>
            <th style={{ padding: "14px 18px", textAlign: "center", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>STATUS</th>
            <th style={{ padding: "14px 18px", textAlign: "center", fontWeight: 600, fontSize: "11px", letterSpacing: "0.5px" }}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const divBps = parseInt(row.oracleDivergenceBps, 10) || 0;
            const basisBps = parseInt(row.crossPlatformBasisBps, 10) || 0;

            return (
              <tr
                key={`${row.ticker}-${row.platform}`}
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                  color: "#FFFFFF",
                  transition: "background 0.15s ease",
                }}
              >
                <td style={{ padding: "14px 18px", fontWeight: 700, fontSize: "14px" }}>
                  {row.ticker}
                </td>
                <td style={{ padding: "14px 18px" }}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#B0B4BA",
                    }}
                  >
                    {row.platform}
                  </span>
                </td>
                <td
                  style={{
                    padding: "14px 18px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#F0B90B",
                    fontWeight: 600,
                  }}
                >
                  ${row.perSharePrice.slice(0, 8)}
                </td>
                <td
                  style={{
                    padding: "14px 18px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#47C2FF",
                  }}
                >
                  ${row.tradfiPrice.slice(0, 8)}
                </td>
                <td
                  style={{
                    padding: "14px 18px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    color: divBps > 25 ? "#F6465D" : divBps > 10 ? "#F0B90B" : "#0ECB81",
                  }}
                >
                  {divBps > 0 ? `+${divBps}` : divBps} bps
                </td>
                <td
                  style={{
                    padding: "14px 18px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: basisBps > 20 ? "#F0B90B" : "#848E9C",
                    fontWeight: basisBps > 20 ? 600 : 400,
                  }}
                >
                  {basisBps > 0 ? `+${basisBps} bps` : "—"}
                </td>
                <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "#848E9C" }}>
                  ${(row.dexLiquidityUsd.split(".")[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </td>
                <td style={{ padding: "14px 18px", textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: "9999px",
                      fontSize: "10px",
                      fontWeight: 700,
                      backgroundColor:
                        row.marketStatus === "OPEN" ? "rgba(14, 203, 129, 0.15)" : "rgba(255, 255, 255, 0.08)",
                      border: row.marketStatus === "OPEN" ? "1px solid rgba(14, 203, 129, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: row.marketStatus === "OPEN" ? "#0ECB81" : "#787B86",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {row.marketStatus}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", textAlign: "center" }}>
                  <AnimatedButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectRow?.(row.ticker)}
                    style={{
                      borderRadius: "9999px",
                      fontSize: "11px",
                      padding: "4px 12px",
                      height: "28px",
                      color: "#F0B90B",
                    }}
                  >
                    Inspect
                  </AnimatedButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
