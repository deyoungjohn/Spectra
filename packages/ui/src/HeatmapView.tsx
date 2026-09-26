// packages/ui/src/HeatmapView.tsx
import React from "react";

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
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "8px",
        padding: "16px 0",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {items.map((item) => {
        const isSelected = selectedTicker === item.ticker;
        const divBps = parseInt(item.oracleDivergenceBps, 10) || 0;
        const basisBps = parseInt(item.crossPlatformBasisBps, 10) || 0;

        return (
          <div
            key={`${item.ticker}-${item.platform}`}
            onClick={() => onSelectTicker?.(item.ticker)}
            style={{
              backgroundColor: "#16181D",
              border: isSelected ? "2px solid #F0B90B" : "1px solid #23272E",
              borderTop: `4px solid ${item.signalColor}`,
              borderRadius: "6px",
              padding: "12px",
              cursor: "pointer",
              transition: "transform 0.1s ease, border-color 0.15s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "16px", color: "#FFFFFF" }}>
                {item.ticker}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "#2B313A",
                  color: "#EAECEF",
                  fontWeight: 600,
                }}
              >
                {item.platform}
              </span>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#848E9C" }}>Per-Share Price</div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#F0B90B", // On-chain price color (§11)
                  fontFamily: "monospace",
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
                borderTop: "1px solid #23272E",
                paddingTop: "6px",
              }}
            >
              <span style={{ color: "#848E9C" }}>Oracle Div:</span>
              <span
                style={{
                  fontWeight: 600,
                  color: divBps > 25 ? "#F6465D" : divBps > 10 ? "#F0B90B" : "#0ECB81",
                  fontFamily: "monospace",
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
                  marginTop: "4px",
                }}
              >
                <span style={{ color: "#848E9C" }}>Cross Basis:</span>
                <span style={{ fontWeight: 600, color: "#F0B90B", fontFamily: "monospace" }}>
                  +{basisBps} bps
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
