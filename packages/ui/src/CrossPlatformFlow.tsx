// packages/ui/src/CrossPlatformFlow.tsx
//
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
        backgroundColor: "#181A20",
        border: "1px solid #2B313A",
        borderRadius: "8px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#EAECEF" }}>
            {ticker} Cross-Platform Flow Routing
          </h3>
          <span style={{ fontSize: "12px", color: "#848E9C" }}>
            24h Net Liquidity Migration across BSC Issuers
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#848E9C" }}>Dominant Venue:</span>
          <span
            data-testid="dominant-venue-badge"
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              backgroundColor: "#2B2414",
              border: "1px solid #F0B90B",
              color: "#F0B90B",
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
          gap: "12px",
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
                backgroundColor: isDominant ? "#20252E" : "#14151A",
                border: isDominant ? "1px solid #F0B90B" : "1px solid #2B313A",
                borderRadius: "6px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#EAECEF", fontSize: "14px" }}>{v.name}</span>
                <span style={{ fontSize: "10px", padding: "1px 5px", backgroundColor: "#2B313A", borderRadius: "3px", color: "#848E9C" }}>
                  {v.fee} fee
                </span>
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  fontFamily: "JetBrains Mono, monospace",
                  color: isPos ? "#0ECB81" : "#F6465D",
                }}
              >
                {isPos ? `+${formatDollars(v.netFlow)}` : formatDollars(v.netFlow)}
              </div>
              <div style={{ fontSize: "11px", color: isDominant ? "#F0B90B" : "#848E9C" }}>
                {isDominant ? "★ Highest Net Accumulation" : "Secondary Venue"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Aggregate Bottom Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          backgroundColor: "#20252E",
          borderRadius: "6px",
          fontSize: "12px",
        }}
      >
        <span style={{ color: "#848E9C" }}>Total Cross-Platform 24h Net Flow</span>
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700,
            color: !totalNetFlowUsd.startsWith("-") ? "#0ECB81" : "#F6465D",
          }}
        >
          {!totalNetFlowUsd.startsWith("-") ? `+${formatDollars(totalNetFlowUsd)}` : formatDollars(totalNetFlowUsd)}
        </span>
      </div>
    </div>
  );
};
