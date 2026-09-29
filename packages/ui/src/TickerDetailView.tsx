// packages/ui/src/TickerDetailView.tsx
import React from "react";
import { PlatformComparison, type PlatformQuote } from "./PlatformComparison.js";
import { motion } from "motion/react";
import { SPRING_PRESS } from "./lib/ease.js";

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
        backgroundColor: "rgba(22, 24, 29, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        color: "#FFFFFF",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
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
            marginBottom: "18px",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "color 0.15s ease",
          }}
          className="hover:text-white"
        >
          <span>←</span>
          <span>Back to Heatmap</span>
        </button>
      )}

      {/* Header section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "18px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>{ticker}</h1>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor:
                  marketStatus === "OPEN" ? "rgba(14, 203, 129, 0.12)" : "rgba(120, 123, 134, 0.15)",
                border: `1px solid ${marketStatus === "OPEN" ? "rgba(14, 203, 129, 0.3)" : "rgba(120, 123, 134, 0.2)"}`,
                color: marketStatus === "OPEN" ? "#0ECB81" : "#787B86",
              }}
            >
              {marketStatus}
            </span>
          </div>
          <div style={{ color: "#848E9C", fontSize: "13px", marginTop: "4px" }}>
            Tokenized Equity on BNB Smart Chain • Continuous 24/7 Arbitrage
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={SPRING_PRESS}
          onClick={() => onForgeStrategy?.(ticker)}
          style={{
            backgroundColor: "#F0B90B",
            color: "#000000",
            border: "none",
            borderRadius: "8px",
            padding: "10px 22px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(240, 185, 11, 0.25)",
            transition: "all 0.15s ease",
          }}
          className="hover:bg-yellow-400 hover:shadow-lg"
        >
          Forge Strategy →
        </motion.button>
      </div>

      {/* Price comparison card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(30, 35, 41, 0.7)",
            borderRadius: "12px",
            padding: "18px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div style={{ color: "#848E9C", fontSize: "12px", marginBottom: "6px" }}>
            On-Chain Per-Share Price
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#F0B90B",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ${perSharePrice.slice(0, 8)}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(30, 35, 41, 0.7)",
            borderRadius: "12px",
            padding: "18px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div style={{ color: "#848E9C", fontSize: "12px", marginBottom: "6px" }}>
            TradFi Reference Price
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "#4A90E2",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ${tradfiPrice.slice(0, 8)}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(30, 35, 41, 0.7)",
            borderRadius: "12px",
            padding: "18px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div style={{ color: "#848E9C", fontSize: "12px", marginBottom: "6px" }}>
            Oracle Divergence Spread
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: divBps > 25 ? "#F6465D" : divBps > 10 ? "#F0B90B" : "#0ECB81",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {divBps > 0 ? `+${divBps}` : divBps} bps
          </div>
        </div>
      </div>

      {/* Active Alpha Signals */}
      {signals.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "12px",
              color: "#848E9C",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.88px",
              fontWeight: 600,
            }}
          >
            ACTIVE ALPHA SIGNALS
          </h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {signals.map((sig) => (
              <div
                key={sig.id}
                style={{
                  backgroundColor:
                    sig.severity === "critical"
                      ? "rgba(246, 70, 93, 0.12)"
                      : "rgba(240, 185, 11, 0.12)",
                  color: sig.severity === "critical" ? "#F6465D" : "#F0B90B",
                  border:
                    sig.severity === "critical"
                      ? "1px solid rgba(246, 70, 93, 0.35)"
                      : "1px solid rgba(240, 185, 11, 0.35)",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>⚡ [{sig.type}]</span>
                <span>Severity: {sig.severity.toUpperCase()}</span>
                <span>•</span>
                <span>Regime: {sig.regime}</span>
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
