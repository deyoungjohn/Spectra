// packages/ui/src/CrossPlatformFlow.tsx
// Module 3: Cross-Platform Flow Comparison Component
// Compares on-chain token flows across Ondo, bStocks, and xStocks.
// Reference: Spectra.md §8.1, §8.4

import React from "react";

export interface CrossPlatformFlowProps {
  ticker: string;
  ondoNetFlowUsd: string;
  bStocksNetFlowUsd: string;
  xStocksNetFlowUsd: string;
  totalNetFlowUsd: string;
  dominantPlatform: string;
}

function formatDollars(valueStr: string): string {
  const isNeg = valueStr.startsWith("-");
  const clean = isNeg ? valueStr.slice(1) : valueStr;
  const parts = clean.split(".");
  const whole = (parts[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = parts[1] ? parts[1].slice(0, 2) : "00";
  return `${isNeg ? "-" : ""}$${whole}.${cents}`;
}

export const CrossPlatformFlow: React.FC<CrossPlatformFlowProps> = ({
  ticker,
  ondoNetFlowUsd,
  bStocksNetFlowUsd,
  xStocksNetFlowUsd,
  totalNetFlowUsd,
  dominantPlatform,
}) => {
  const venues = [
    { name: "Ondo Finance", code: "ONDO", netFlow: ondoNetFlowUsd, fee: "0.15%" },
    { name: "bStocks (PancakeSwap)", code: "BSTOCKS", netFlow: bStocksNetFlowUsd, fee: "0.25%" },
    { name: "xStocks", code: "XSTOCKS", netFlow: xStocksNetFlowUsd, fee: "0.30%" },
  ];

  return (
    <div
      style={{
        backgroundColor: "rgba(22, 24, 29, 0.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#EAECEF" }}>
            {ticker} Cross-Platform Flow Routing
          </h3>
          <span style={{ fontSize: "12px", color: "#848E9C" }}>
            24h Net Liquidity Migration across BSC Issuers • Total Net Flow: {formatDollars(totalNetFlowUsd)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#848E9C" }}>Dominant Venue:</span>
          <span
            data-testid="dominant-venue-badge"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "9999px",
              backgroundColor: "rgba(240, 185, 11, 0.12)",
              border: "1px solid rgba(240, 185, 11, 0.35)",
              color: "#F0B90B",
              boxShadow: "0 0 10px rgba(240, 185, 11, 0.15)",
            }}
          >
            {dominantPlatform}
          </span>
        </div>
      </div>

      {/* Venues Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        {venues.map((v) => {
          const isDominant = v.code === dominantPlatform;
          const isPos = !v.netFlow.startsWith("-");

          return (
            <div
              key={v.code}
              data-testid={`venue-card-${v.code}`}
              style={{
                backgroundColor: isDominant ? "rgba(30, 35, 41, 0.85)" : "rgba(20, 22, 27, 0.6)",
                border: isDominant ? "1px solid rgba(240, 185, 11, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: isDominant ? "0 4px 16px rgba(240, 185, 11, 0.08)" : "none",
                transition: "all 0.15s ease",
              }}
              className="hover:border-white/20"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>
                  {v.name}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#848E9C",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  Fee: {v.fee}
                </span>
              </div>

              <div>
                <div style={{ fontSize: "11px", color: "#848E9C", marginBottom: "3px" }}>24h Net Flow</div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isPos ? "#0ECB81" : "#F6465D",
                  }}
                >
                  {isPos ? `+${formatDollars(v.netFlow)}` : formatDollars(v.netFlow)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
