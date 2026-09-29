// packages/ui/src/PlatformComparison.tsx
import React from "react";

export interface PlatformQuote {
  platform: string;
  tokenAddress: string;
  tokenPrice: string;
  perSharePrice: string;
  dexLiquidityUsd: string;
  slippageBps: string;
}

export interface PlatformComparisonProps {
  ticker: string;
  platforms: PlatformQuote[];
  tradfiPrice?: string;
}

export const PlatformComparison: React.FC<PlatformComparisonProps> = ({
  ticker,
  platforms,
  tradfiPrice,
}) => {
  return (
    <div
      style={{
        backgroundColor: "rgba(22, 24, 29, 0.7)",
        backdropFilter: "blur(12px)",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>
            {ticker} Cross-Platform Comparison
          </span>
          <span style={{ fontSize: "12px", color: "#848E9C", marginLeft: "10px" }}>
            (Live Arbitrage & Basis Detection)
          </span>
        </div>
        {tradfiPrice && (
          <div
            style={{
              fontSize: "12px",
              padding: "4px 10px",
              borderRadius: "6px",
              backgroundColor: "rgba(13, 116, 206, 0.12)",
              border: "1px solid rgba(13, 116, 206, 0.3)",
            }}
          >
            <span style={{ color: "#848E9C" }}>TradFi Anchor: </span>
            <span style={{ color: "#4A90E2", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              ${tradfiPrice.slice(0, 8)}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(platforms.length, 1)}, 1fr)`,
          gap: "14px",
        }}
      >
        {platforms.map((p) => (
          <div
            key={p.platform}
            style={{
              backgroundColor: "rgba(30, 35, 41, 0.7)",
              borderRadius: "10px",
              padding: "16px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              transition: "border-color 0.15s ease",
            }}
            className="hover:border-yellow-500/30"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "14px" }}>
                {p.platform}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  color: "#848E9C",
                }}
              >
                Slip: {p.slippageBps} bps
              </span>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#848E9C", marginBottom: "2px" }}>Per-Share Price</div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#F0B90B",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ${p.perSharePrice.slice(0, 8)}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#848E9C",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                paddingTop: "8px",
              }}
            >
              <span>Token: ${p.tokenPrice.slice(0, 8)}</span>
              <span>Liq: ${(p.dexLiquidityUsd.split(".")[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
