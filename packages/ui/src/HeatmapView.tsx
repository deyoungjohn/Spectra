// packages/ui/src/HeatmapView.tsx
"use client";

import React from "react";
import { TiltCard } from "./motion/TiltCard.js";

export interface HeatmapItem {
  ticker: string;
  platform: string;
  perSharePrice: string;
  tradfiPrice: string;
  oracleDivergenceBps: string;
  crossPlatformBasisBps: string;
  signalColor: string;
  marketStatus: string;
  dexLiquidityUsd: string;
}

export interface HeatmapViewProps {
  items: HeatmapItem[];
  selectedTicker?: string | null;
  onSelectTicker?: (ticker: string) => void;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  items,
  selectedTicker,
  onSelectTicker,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "14px",
        padding: "16px 0",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {items.map((item) => {
        const isSelected = selectedTicker === item.ticker;
        const divBps = parseInt(item.oracleDivergenceBps, 10) || 0;
        const basisBps = parseInt(item.crossPlatformBasisBps, 10) || 0;

        return (
          <TiltCard
            key={`${item.ticker}-${item.platform}`}
            onClick={() => onSelectTicker?.(item.ticker)}
            max={7}
            style={{
              backgroundColor: isSelected ? "#1A1D24" : "#14161C",
              border: isSelected ? "1.5px solid #F0B90B" : "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: isSelected
                ? "0 8px 24px rgba(240, 185, 11, 0.15), 0 0 0 1px rgba(240, 185, 11, 0.3)"
                : "0 4px 16px rgba(0, 0, 0, 0.25)",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            {/* Top color indicator accent bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "16px",
                right: "16px",
                height: "3px",
                borderRadius: "0 0 4px 4px",
                backgroundColor: item.signalColor,
                opacity: 0.9,
                boxShadow: `0 0 8px ${item.signalColor}`,
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "4px",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: 700, fontSize: "17px", color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                  {item.ticker}
                </span>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#B0B4BA",
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                }}
              >
                {item.platform}
              </span>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "#848E9C", fontWeight: 500, marginBottom: "2px" }}>Per-Share Price</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#F0B90B",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "-0.5px",
                }}
              >
                ${item.perSharePrice.slice(0, 8)}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                paddingTop: "8px",
              }}
            >
              <span style={{ color: "#848E9C" }}>Oracle Div</span>
              <span
                style={{
                  fontWeight: 600,
                  color: divBps > 25 ? "#F6465D" : divBps > 10 ? "#F0B90B" : "#0ECB81",
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: divBps > 25 ? "rgba(246, 70, 93, 0.1)" : divBps > 10 ? "rgba(240, 185, 11, 0.1)" : "rgba(14, 203, 129, 0.1)",
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}
              >
                {divBps > 0 ? `+${divBps}` : divBps} bps
              </span>
            </div>

            {basisBps > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11px",
                  marginTop: "6px",
                }}
              >
                <span style={{ color: "#848E9C" }}>Cross Basis</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: "#F0B90B",
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: "rgba(240, 185, 11, 0.1)",
                    padding: "1px 6px",
                    borderRadius: "4px",
                  }}
                >
                  +{basisBps} bps
                </span>
              </div>
            )}
          </TiltCard>
        );
      })}
    </div>
  );
};
