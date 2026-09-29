// packages/ui/src/FlowDashboard.tsx
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", fontFamily: "Inter, sans-serif" }}>
      {/* Stale or degradation warning */}
      {isStale && (
        <div
          data-testid="flow-stale-banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            backgroundColor: "rgba(240, 185, 11, 0.1)",
            border: "1px solid rgba(240, 185, 11, 0.35)",
            borderRadius: "10px",
            color: "#F0B90B",
            fontSize: "13px",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚠️</span>
            <span><strong>Flow Radar Degraded:</strong> Serving cached on-chain transfer events. Live BscScan feeds suspended.</span>
          </div>
          {lastUpdated && <span style={{ color: "#848E9C", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}>Last update: {lastUpdated}</span>}
        </div>
      )}

      {/* Header Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Total 24h Flow Card */}
        <div
          style={{
            backgroundColor: "rgba(22, 24, 29, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div
            style={{
              color: "#848E9C",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.88px",
              fontWeight: 600,
            }}
          >
            Total 24h Smart Money Net Flow
          </div>
          <div
            data-testid="total-net-flow"
            style={{
              fontSize: "28px",
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: isNetPositive ? "#0ECB81" : "#F6465D",
              textShadow: isNetPositive ? "0 0 16px rgba(14, 203, 129, 0.25)" : "0 0 16px rgba(246, 70, 93, 0.25)",
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
            backgroundColor: "rgba(22, 24, 29, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "20px 22px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div
            style={{
              color: "#0ECB81",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.88px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>▲</span>
            <span>Top Accumulation (Smart Inflows)</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topAccumulated.slice(0, 3).map((item) => (
              <div
                key={item.ticker}
                data-testid={`accum-item-${item.ticker}`}
                onClick={() => onSelectTicker?.(item.ticker)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(30, 35, 41, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  cursor: onSelectTicker ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
                className="hover:border-green-500/30 hover:bg-white/[0.04]"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "14px" }}>
                    {item.ticker}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      color: "#848E9C",
                      fontWeight: 600,
                    }}
                  >
                    {item.dominantPlatform}
                  </span>
                </div>
                <span
                  style={{
                    color: "#0ECB81",
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px",
                  }}
                >
                  +{formatDollars(item.netFlow24hUsd)}
                </span>
              </div>
            ))}
            {topAccumulated.length === 0 && (
              <div style={{ color: "#848E9C", fontSize: "12px", fontStyle: "italic" }}>
                No significant accumulation detected
              </div>
            )}
          </div>
        </div>

        {/* Top Distributers Card */}
        <div
          style={{
            backgroundColor: "rgba(22, 24, 29, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "20px 22px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div
            style={{
              color: "#F6465D",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.88px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>▼</span>
            <span>Top Distribution (Selling Pressure)</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topDistributed.slice(0, 3).map((item) => (
              <div
                key={item.ticker}
                data-testid={`dist-item-${item.ticker}`}
                onClick={() => onSelectTicker?.(item.ticker)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(30, 35, 41, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  cursor: onSelectTicker ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
                className="hover:border-red-500/30 hover:bg-white/[0.04]"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "14px" }}>
                    {item.ticker}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      color: "#848E9C",
                      fontWeight: 600,
                    }}
                  >
                    {item.dominantPlatform}
                  </span>
                </div>
                <span
                  style={{
                    color: "#F6465D",
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px",
                  }}
                >
                  {formatDollars(item.netFlow24hUsd)}
                </span>
              </div>
            ))}
            {topDistributed.length === 0 && (
              <div style={{ color: "#848E9C", fontSize: "12px", fontStyle: "italic" }}>
                No significant distribution detected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
