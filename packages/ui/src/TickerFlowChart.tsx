// packages/ui/src/TickerFlowChart.tsx
//
// Module 3: Ticker Net Flow Time-Series Chart Component
// Visualizes hourly net flow with pre-event positioning alerts.
// Reference: Spectra.md §8.1, §8.4

import React from "react";

export interface FlowChartPoint {
  timestamp: string;
  inflowUsd: string;
  outflowUsd: string;
  netFlowUsd: string;
}

export interface TickerFlowChartProps {
  ticker: string;
  points: FlowChartPoint[];
  preEventPositioning?: boolean;
  selectedWindow?: "1h" | "4h" | "24h";
  onSelectWindow?: (w: "1h" | "4h" | "24h") => void;
}

function formatDollars(valueStr: string): string {
  const isNeg = valueStr.startsWith("-");
  const clean = isNeg ? valueStr.slice(1) : valueStr;
  const parts = clean.split(".");
  const whole = (parts[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = parts[1] ? parts[1].slice(0, 2) : "00";
  return `${isNeg ? "-" : ""}$${whole}.${cents}`;
}

export const TickerFlowChart: React.FC<TickerFlowChartProps> = ({
  ticker,
  points,
  preEventPositioning = false,
  selectedWindow = "24h",
  onSelectWindow,
}) => {
  // Find max absolute value using BigInt for integer percentage scaling
  let maxAbsVal = 1n;
  for (const p of points) {
    const wholeStr = p.netFlowUsd.split(".")[0] || "0";
    try {
      const val = BigInt(wholeStr);
      const abs = val < 0n ? -val : val;
      if (abs > maxAbsVal) {
        maxAbsVal = abs;
      }
    } catch {
      // ignore
    }
  }

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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#EAECEF" }}>
            {ticker} Net Smart Money Flow
          </h3>
          {preEventPositioning && (
            <span
              data-testid="pre-event-badge"
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: "#2B2414",
                border: "1px solid #F0B90B",
                color: "#F0B90B",
                fontWeight: 600,
              }}
            >
              PRE-EVENT POSITIONING DETECTED
            </span>
          )}
        </div>

        {/* Window controls */}
        {onSelectWindow && (
          <div style={{ display: "flex", gap: "4px" }}>
            {(["1h", "4h", "24h"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onSelectWindow(w)}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: selectedWindow === w ? 600 : 400,
                  backgroundColor: selectedWindow === w ? "#F0B90B" : "#20252E",
                  color: selectedWindow === w ? "#0D0E12" : "#848E9C",
                  border: "1px solid #2B313A",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart visualization */}
      <div
        data-testid="flow-chart-container"
        style={{
          display: "flex",
          alignItems: "center",
          height: "180px",
          gap: "4px",
          padding: "10px 0",
          borderBottom: "1px solid #2B313A",
        }}
      >
        {points.map((p, idx) => {
          const isNeg = p.netFlowUsd.startsWith("-");
          const wholeStr = p.netFlowUsd.split(".")[0] || "0";
          let heightPct = 10n;
          try {
            const val = BigInt(wholeStr);
            const abs = val < 0n ? -val : val;
            heightPct = maxAbsVal > 0n ? (abs * 90n) / maxAbsVal + 10n : 10n;
          } catch {
            heightPct = 10n;
          }

          const heightNum = heightPct.toString();
          const color = isNeg ? "#F6465D" : "#0ECB81";

          return (
            <div
              key={idx}
              title={`${p.timestamp}: Net ${formatDollars(p.netFlowUsd)} (In: ${formatDollars(p.inflowUsd)}, Out: ${formatDollars(p.outflowUsd)})`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxHeight: "85%",
                  height: `${heightNum}%`,
                  backgroundColor: color,
                  borderRadius: "2px",
                  transition: "height 0.2s ease",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "space-between", color: "#848E9C", fontSize: "11px" }}>
        <span>Oldest</span>
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "#0ECB81", borderRadius: "2px" }} />
            Net Inflow (Accumulation)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "#F6465D", borderRadius: "2px" }} />
            Net Outflow (Distribution)
          </span>
        </div>
        <span>Now</span>
      </div>
    </div>
  );
};
