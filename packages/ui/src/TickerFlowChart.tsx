// packages/ui/src/TickerFlowChart.tsx
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
  // Find max absolute value using BigInt for integer percentage scaling (Zero floating-point)
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#EAECEF" }}>
            {ticker} Net Smart Money Flow
          </h3>
          {preEventPositioning && (
            <span
              data-testid="pre-event-badge"
              style={{
                fontSize: "10px",
                padding: "3px 10px",
                borderRadius: "9999px",
                backgroundColor: "rgba(240, 185, 11, 0.12)",
                border: "1px solid rgba(240, 185, 11, 0.35)",
                color: "#F0B90B",
                fontWeight: 700,
                letterSpacing: "0.5px",
                boxShadow: "0 0 10px rgba(240, 185, 11, 0.15)",
              }}
            >
              ⚡ PRE-EVENT POSITIONING DETECTED
            </span>
          )}
        </div>

        {/* Window controls */}
        {onSelectWindow && (
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "rgba(13, 14, 18, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "8px",
              padding: "2px",
              gap: "2px",
            }}
          >
            {(["1h", "4h", "24h"] as const).map((w) => {
              const isSelected = selectedWindow === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => onSelectWindow(w)}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? "rgba(240, 185, 11, 0.15)" : "transparent",
                    color: isSelected ? "#F0B90B" : "#848E9C",
                    border: isSelected ? "1px solid rgba(240, 185, 11, 0.3)" : "1px solid transparent",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {w}
                </button>
              );
            })}
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
          gap: "6px",
          padding: "12px 0",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
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
                cursor: "pointer",
              }}
              className="group"
            >
              <div
                style={{
                  width: "100%",
                  maxHeight: "85%",
                  height: `${heightNum}%`,
                  backgroundColor: color,
                  borderRadius: "4px",
                  boxShadow: `0 0 10px ${color}33`,
                  transition: "all 0.2s ease",
                }}
                className="group-hover:opacity-100 group-hover:scale-y-105"
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "space-between", color: "#848E9C", fontSize: "11px" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Earliest</span>
        <div style={{ display: "flex", gap: "20px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "#0ECB81", borderRadius: "2px", boxShadow: "0 0 6px #0ECB81" }} />
            <span>Net Inflow (Accumulation)</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", backgroundColor: "#F6465D", borderRadius: "2px", boxShadow: "0 0 6px #F6465D" }} />
            <span>Net Outflow (Distribution)</span>
          </span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Now</span>
      </div>
    </div>
  );
};
