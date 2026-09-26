// packages/ui/src/ScreenerTable.tsx
import React from "react";

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
        backgroundColor: "#16181D",
        borderRadius: "8px",
        border: "1px solid #23272E",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #23272E", color: "#848E9C" }}>
            <th style={{ padding: "12px 16px" }}>TICKER</th>
            <th style={{ padding: "12px 16px" }}>PLATFORM</th>
            <th style={{ padding: "12px 16px", textAlign: "right" }}>ONCHAIN PER-SHARE</th>
            <th style={{ padding: "12px 16px", textAlign: "right" }}>TRADFI ANCHOR</th>
            <th style={{ padding: "12px 16px", textAlign: "right" }}>ORACLE DIV</th>
            <th style={{ padding: "12px 16px", textAlign: "right" }}>CROSS-BASIS</th>
            <th style={{ padding: "12px 16px", textAlign: "right" }}>DEX LIQUIDITY</th>
            <th style={{ padding: "12px 16px", textAlign: "center" }}>STATUS</th>
            <th style={{ padding: "12px 16px", textAlign: "center" }}>ACTION</th>
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
                  borderBottom: "1px solid #1E2329",
                  color: "#FFFFFF",
                  transition: "background 0.15s ease",
                }}
              >
                <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                  {row.ticker}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: "#2B313A",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {row.platform}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontFamily: "monospace",
                    color: "#F0B90B",
                    fontWeight: 600,
                  }}
                >
                  ${row.perSharePrice.slice(0, 8)}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontFamily: "monospace",
                    color: "#4A90E2", // TradFi blue (§11)
                  }}
                >
                  ${row.tradfiPrice.slice(0, 8)}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: divBps > 25 ? "#F6465D" : divBps > 10 ? "#F0B90B" : "#0ECB81",
                  }}
                >
                  {divBps > 0 ? `+${divBps}` : divBps} bps
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontFamily: "monospace",
                    color: basisBps > 20 ? "#F0B90B" : "#848E9C",
                    fontWeight: basisBps > 20 ? 600 : 400,
                  }}
                >
                  {basisBps > 0 ? `+${basisBps} bps` : "—"}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", color: "#848E9C" }}>
                  ${(row.dexLiquidityUsd.split(".")[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 600,
                      backgroundColor:
                        row.marketStatus === "OPEN" ? "rgba(14, 203, 129, 0.15)" : "#2B313A",
                      color: row.marketStatus === "OPEN" ? "#0ECB81" : "#787B86",
                    }}
                  >
                    {row.marketStatus}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <button
                    onClick={() => onSelectRow?.(row.ticker)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      border: "1px solid #2B313A",
                      backgroundColor: "#1E2329",
                      color: "#F0B90B",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
