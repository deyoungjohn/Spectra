// packages/ui/src/FlowDashboard.tsx
"use client";

import React from "react";
import { TiltCard } from "./motion/TiltCard.js";
import { AnimatedBadge } from "./motion/AnimatedBadge.js";

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
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", fontFamily: "'Inter', sans-serif" }}>
      {/* Stale or degradation warning */}
      {isStale && (
        <div
          data-testid="flow-stale-banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            backgroundColor: "rgba(240, 185, 11, 0.12)",
            border: "1px solid rgba(240, 185, 11, 0.3)",
            borderRadius: "12px",
            color: "#F0B90B",
            fontSize: "13px",
            backdropFilter: "blur(8px)",
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
        <TiltCard
          max={6}
          style={{
            backgroundColor: "#14161C",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div style={{ color: "#848E9C", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total 24h Smart Money Net Flow
          </div>
          <div
            data-testid="total-net-flow"
            style={{
              fontSize: "26px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: isNetPositive ? "#0ECB81" : "#F6465D",
              letterSpacing: "-0.5px",
            }}
          >
            {isNetPositive ? `+${formatDollars(totalMarketNetFlow24hUsd)}` : formatDollars(totalMarketNetFlow24hUsd)}
          </div>
          <div style={{ color: "#848E9C", fontSize: "12px" }}>
            Aggregated across all verified BSC equity pools
          </div>
        </TiltCard>

        {/* Top Accumulators Card */}
        <TiltCard
          max={6}
          style={{
            backgroundColor: "#14161C",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px 22px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div style={{ color: "#0ECB81", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
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
                  padding: "8px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "10px",
                  cursor: onSelectTicker ? "pointer" : "default",
                  transition: "background-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, color: "#EAECEF", fontSize: "14px" }}>{item.ticker}</span>
                  <AnimatedBadge label={item.dominantPlatform} status="neutral" size="sm" />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#0ECB81", fontWeight: 600, fontSize: "13px" }}>
                  +{formatDollars(item.netFlow24hUsd)}
                </span>
              </div>
            ))}
          </div>
        </TiltCard>

        {/* Top Distribution Card */}
        <TiltCard
          max={6}
          style={{
            backgroundColor: "#14161C",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "20px 22px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div style={{ color: "#F6465D", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>
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
                  padding: "8px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "10px",
                  cursor: onSelectTicker ? "pointer" : "default",
                  transition: "background-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, color: "#EAECEF", fontSize: "14px" }}>{item.ticker}</span>
                  <AnimatedBadge label={item.dominantPlatform} status="neutral" size="sm" />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#F6465D", fontWeight: 600, fontSize: "13px" }}>
                  {formatDollars(item.netFlow24hUsd)}
                </span>
              </div>
            ))}
          </div>
        </TiltCard>
      </div>
    </div>
  );
};
