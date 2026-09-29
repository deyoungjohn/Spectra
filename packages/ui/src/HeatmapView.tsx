// packages/ui/src/HeatmapView.tsx
import React from "react";
import { TiltCard } from "./components/motion/tilt-card.js";

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
        gap: "12px",
        padding: "16px 0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {items.map((item) => {
        const isSelected = selectedTicker === item.ticker;
        const divBps = parseInt(item.oracleDivergenceBps, 10) || 0;
        const basisBps = parseInt(item.crossPlatformBasisBps, 10) || 0;

        return (
          <TiltCard
            key={`${item.ticker}-${item.platform}`}
            max={7}
            glare={true}
            onClick={() => onSelectTicker?.(item.ticker)}
            style={{
              backgroundColor: isSelected ? "rgba(30, 35, 41, 0.95)" : "rgba(22, 24, 29, 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: isSelected
                ? "1.5px solid #F0B90B"
                : "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: isSelected
                ? "0 4px 20px rgba(240, 185, 11, 0.2)"
                : "0 4px 16px rgba(0, 0, 0, 0.2)",
              cursor: "pointer",
            }}
            className="group hover:border-white/20 transition-all duration-200"
          >
            {/* Top Accent Stripe indicating signal severity */}
            <div
              style={{
                height: "3px",
                width: "100%",
                backgroundColor: item.signalColor,
                boxShadow: `0 0 8px ${item.signalColor}`,
              }}
            />

            <div style={{ padding: "14px 16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "17px",
                    color: "#FFFFFF",
                    letterSpacing: "0.5px",
                  }}
                >
                  {item.ticker}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#EAECEF",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                  }}
                >
                  {item.platform}
                </span>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "11px", color: "#848E9C", marginBottom: "2px" }}>
                  Per-Share Value
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#F0B90B",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  ${item.perSharePrice.slice(0, 8)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  paddingTop: "8px",
                }}
              >
                <span style={{ color: "#848E9C" }}>Oracle Div:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: divBps > 25 ? "#F6465D" : divBps > 10 ? "#F0B90B" : "#0ECB81",
                    fontFamily: "'JetBrains Mono', monospace",
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
                    fontSize: "11px",
                    marginTop: "5px",
                  }}
                >
                  <span style={{ color: "#848E9C" }}>Cross Basis:</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#F0B90B",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    +{basisBps} bps
                  </span>
                </div>
              )}
            </div>
          </TiltCard>
        );
      })}
    </div>
  );
};
