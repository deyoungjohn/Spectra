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
        backgroundColor: "rgba(22, 24, 29, 0.75)",
        backdropFilter: "blur(12px)",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        fontFamily: "Inter, sans-serif",
      }}
    >
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
              backgroundColor: "rgba(13, 14, 18, 0.4)",
            }}
          >
            <th style={{ padding: "14px 18px" }}>TICKER</th>
            <th style={{ padding: "14px 18px" }}>PLATFORM</th>
            <th style={{ padding: "14px 18px", textAlign: "right" }}>ONCHAIN PER-SHARE</th>
            <th style={{ padding: "14px 18px", textAlign: "right" }}>TRADFI ANCHOR</th>
            <th style={{ padding: "14px 18px", textAlign: "right" }}>ORACLE DIV</th>
            <th style={{ padding: "14px 18px", textAlign: "right" }}>CROSS-BASIS</th>
            <th style={{ padding: "14px 18px", textAlign: "right" }}>DEX LIQUIDITY</th>
            <th style={{ padding: "14px 18px", textAlign: "center" }}>STATUS</th>
            <th style={{ padding: "14px 18px", textAlign: "center" }}>ACTION</th>
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
                  transition: "background-color 0.15s ease",
                }}
                className="hover:bg-white/[0.03]"
              >
                <td style={{ padding: "14px 18px", fontWeight: 700, fontSize: "14px" }}>
                  {row.ticker}
                </td>
                <td style={{ padding: "14px 18px" }}>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#EAECEF",
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
                    fontWeight: 700,
                  }}
                >
                  ${row.perSharePrice.slice(0, 8)}
                </td>
                <td
                  style={{
                    padding: "14px 18px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#0D74CE",
                    fontWeight: 500,
                  }}
                >
                  ${row.tradfiPrice.slice(0, 8)}
                </td>
                <td
                  style={{
                    padding: "14px 18px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
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
                    fontWeight: basisBps > 20 ? 700 : 400,
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
                        row.marketStatus === "OPEN" ? "rgba(14, 203, 129, 0.12)" : "rgba(120, 123, 134, 0.15)",
                      border: `1px solid ${row.marketStatus === "OPEN" ? "rgba(14, 203, 129, 0.3)" : "rgba(120, 123, 134, 0.2)"}`,
                      color: row.marketStatus === "OPEN" ? "#0ECB81" : "#787B86",
                    }}
                  >
                    {row.marketStatus}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", textAlign: "center" }}>
                  <button
                    onClick={() => onSelectRow?.(row.ticker)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(240, 185, 11, 0.3)",
                      backgroundColor: "rgba(240, 185, 11, 0.1)",
                      color: "#F0B90B",
                      fontSize: "11px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.15s ease",
                    }}
                    className="hover:bg-yellow-500/20 hover:scale-105"
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
