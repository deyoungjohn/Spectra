// packages/ui/src/FlowDashboard.tsx
//
// Module 3: Flow Radar Dashboard Overview
// Reference: Spectra.md §8.1, §8.4

import React from "react";

export interface FlowLeaderboardItem {
  ticker: string;
  netFlow24hUsd: string;
  dominantPlatform: string;
}

export interface FlowDashboardProps {
  totalMarketNetFlow24hUsd: string;
  topAccumulated: FlowLeaderboardItem[];
  topDistributed: FlowLeaderboardItem[];
  isStale?: boolean;
  lastUpdated?: string;
  onSelectTicker?: (ticker: string) => void;
}

function formatDollars(valueStr: string): string {
  const isNeg = valueStr.startsWith("-");
  const clean = isNeg ? valueStr.slice(1) : valueStr;
  const parts = clean.split(".");
  const whole = (parts[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = parts[1] ? parts[1].slice(0, 2) : "00";
  return `${isNeg ? "-" : ""}$${whole}.${cents}`;
}

export const FlowDashboard: React.FC<FlowDashboardProps> = ({
  totalMarketNetFlow24hUsd,
  topAccumulated,
  topDistributed,
  isStale = false,
  lastUpdated,
  onSelectTicker,
}) => {
  const isNetPositive = !totalMarketNetFlow24hUsd.startsWith("-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* Stale or degradation warning */}
      {isStale && (
        <div
          data-testid="flow-stale-banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            backgroundColor: "#2B2414",
            border: "1px solid #F0B90B",
            borderRadius: "6px",
            color: "#F0B90B",
            fontSize: "13px",
          }}
        >
          <span>⚠️ <strong>Flow Radar Degraded:</strong> Serving cached on-chain transfer events. Live BscScan feeds suspended.</span>
          {lastUpdated && <span style={{ color: "#848E9C", fontSize: "11px" }}>Last update: {lastUpdated}</span>}
        </div>
      )}

      {/* Header Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Total 24h Flow Card */}
        <div
          style={{
            backgroundColor: "#181A20",
            border: "1px solid #2B313A",
            borderRadius: "8px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ color: "#848E9C", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total 24h Smart Money Net Flow
          </div>
          <div
            data-testid="total-net-flow"
            style={{
              fontSize: "24px",
              fontWeight: 700,
              fontFamily: "JetBrains Mono, monospace",
              color: isNetPositive ? "#0ECB81" : "#F6465D",
            }}
          >
            {isNetPositive ? `+${formatDollars(totalMarketNetFlow24hUsd)}` : formatDollars(totalMarketNetFlow24hUsd)}
          </div>
          <div style={{ color: "#848E9C", fontSize: "12px" }}>
            Aggregated across all verified BSC equity pools
          </div>
        </div>

        {/* Top Accumulators Card */}
        <div
          style={{
            backgroundColor: "#181A20",
            border: "1px solid #2B313A",
            borderRadius: "8px",
            padding: "18px 20px",
          }}
        >
          <div style={{ color: "#0ECB81", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", marginBottom: "12px" }}>
            ▲ Top Accumulation (Smart Inflows)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topAccumulated.slice(0, 3).map((item) => (
              <div
                key={item.ticker}
                data-testid={`accum-item-${item.ticker}`}
                onClick={() => onSelectTicker?.(item.ticker)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 10px",
                  backgroundColor: "#20252E",
                  borderRadius: "4px",
                  cursor: onSelectTicker ? "pointer" : "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, color: "#EAECEF" }}>{item.ticker}</span>
                  <span style={{ fontSize: "10px", padding: "1px 5px", backgroundColor: "#2B313A", borderRadius: "3px", color: "#848E9C" }}>
                    {item.dominantPlatform}
                  </span>
                </div>
                <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#0ECB81", fontWeight: 600 }}>
                  +{formatDollars(item.netFlow24hUsd)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Distribution Card */}
        <div
          style={{
            backgroundColor: "#181A20",
            border: "1px solid #2B313A",
            borderRadius: "8px",
            padding: "18px 20px",
          }}
        >
          <div style={{ color: "#F6465D", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", marginBottom: "12px" }}>
            ▼ Top Distribution (Whale Outflows)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topDistributed.slice(0, 3).map((item) => (
              <div
                key={item.ticker}
                data-testid={`dist-item-${item.ticker}`}
                onClick={() => onSelectTicker?.(item.ticker)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 10px",
                  backgroundColor: "#20252E",
                  borderRadius: "4px",
                  cursor: onSelectTicker ? "pointer" : "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, color: "#EAECEF" }}>{item.ticker}</span>
                  <span style={{ fontSize: "10px", padding: "1px 5px", backgroundColor: "#2B313A", borderRadius: "3px", color: "#848E9C" }}>
                    {item.dominantPlatform}
                  </span>
                </div>
                <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#F6465D", fontWeight: 600 }}>
                  {formatDollars(item.netFlow24hUsd)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
