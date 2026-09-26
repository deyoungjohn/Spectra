// packages/ui/src/TickerDetailView.tsx
import React from "react";
import { PlatformComparison, type PlatformQuote } from "./PlatformComparison.js";

export interface SignalDetail {
  id: string;
  type: string;
  severity: string;
  value: string;
  actionable: boolean;
  regime: string;
}

export interface TickerDetailViewProps {
  ticker: string;
  perSharePrice: string;
  tradfiPrice: string;
  oracleDivergenceBps: string;
  marketStatus: string;
  platforms: PlatformQuote[];
  signals: SignalDetail[];
  onForgeStrategy?: (ticker: string) => void;
  onBack?: () => void;
}

export const TickerDetailView: React.FC<TickerDetailViewProps> = ({
  ticker,
  perSharePrice,
  tradfiPrice,
  oracleDivergenceBps,
  marketStatus,
  platforms,
  signals,
  onForgeStrategy,
  onBack,
}) => {
  const divBps = parseInt(oracleDivergenceBps, 10) || 0;

  return (
    <div
      style={{
        backgroundColor: "#0D0E12",
        color: "#FFFFFF",
        padding: "20px",
        borderRadius: "8px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#848E9C",
            fontSize: "13px",
            cursor: "pointer",
            marginBottom: "16px",
            padding: 0,
          }}
        >
          ← Back to Heatmap
        </button>
      )}

      {/* Header section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          borderBottom: "1px solid #23272E",
          paddingBottom: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0 }}>{ticker}</h1>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor:
                  marketStatus === "OPEN" ? "rgba(14, 203, 129, 0.15)" : "#2B313A",
                color: marketStatus === "OPEN" ? "#0ECB81" : "#787B86",
              }}
            >
              {marketStatus}
            </span>
          </div>
          <div style={{ color: "#848E9C", fontSize: "13px", marginTop: "4px" }}>
            Tokenized Equity on BNB Smart Chain
          </div>
        </div>

        <button
          onClick={() => onForgeStrategy?.(ticker)}
          style={{
            backgroundColor: "#F0B90B",
            color: "#000000",
            border: "none",
            borderRadius: "6px",
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            transition: "opacity 0.15s ease",
          }}
        >
          Forge Strategy →
        </button>
      </div>

      {/* Price comparison card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#16181D",
            borderRadius: "6px",
            padding: "16px",
            border: "1px solid #23272E",
          }}
        >
          <div style={{ color: "#848E9C", fontSize: "12px", marginBottom: "4px" }}>
            On-Chain Per-Share Price
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#F0B90B",
              fontFamily: "monospace",
            }}
          >
            ${perSharePrice.slice(0, 8)}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#16181D",
            borderRadius: "6px",
            padding: "16px",
            border: "1px solid #23272E",
          }}
        >
          <div style={{ color: "#848E9C", fontSize: "12px", marginBottom: "4px" }}>
            TradFi Reference Price
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#4A90E2",
              fontFamily: "monospace",
            }}
          >
            ${tradfiPrice.slice(0, 8)}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#16181D",
            borderRadius: "6px",
            padding: "16px",
            border: "1px solid #23272E",
          }}
        >
          <div style={{ color: "#848E9C", fontSize: "12px", marginBottom: "4px" }}>
            Oracle Divergence Spread
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: divBps > 25 ? "#F6465D" : divBps > 10 ? "#F0B90B" : "#0ECB81",
              fontFamily: "monospace",
            }}
          >
            {divBps > 0 ? `+${divBps}` : divBps} bps
          </div>
        </div>
      </div>

      {/* Active Alpha Signals */}
      {signals.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", color: "#848E9C", marginBottom: "8px" }}>
            ACTIVE ALPHA SIGNALS
          </h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {signals.map((sig) => (
              <div
                key={sig.id}
                style={{
                  backgroundColor:
                    sig.severity === "critical"
                      ? "rgba(246, 70, 93, 0.15)"
                      : "rgba(240, 185, 11, 0.15)",
                  color: sig.severity === "critical" ? "#F6465D" : "#F0B90B",
                  border:
                    sig.severity === "critical"
                      ? "1px solid #F6465D"
                      : "1px solid #F0B90B",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                [{sig.type}] Severity: {sig.severity.toUpperCase()} | Regime: {sig.regime}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-platform comparison */}
      <PlatformComparison ticker={ticker} platforms={platforms} tradfiPrice={tradfiPrice} />
    </div>
  );
};
