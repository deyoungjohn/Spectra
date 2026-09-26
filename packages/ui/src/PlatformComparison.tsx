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
        backgroundColor: "#16181D",
        borderRadius: "8px",
        border: "1px solid #23272E",
        padding: "16px",
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
          <div style={{ fontSize: "13px" }}>
            <span style={{ color: "#848E9C" }}>TradFi Anchor: </span>
            <span style={{ color: "#4A90E2", fontWeight: 600, fontFamily: "monospace" }}>
              ${tradfiPrice.slice(0, 8)}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(platforms.length, 1)}, 1fr)`,
          gap: "12px",
        }}
      >
        {platforms.map((p) => (
          <div
            key={p.platform}
            style={{
              backgroundColor: "#1E2329",
              borderRadius: "6px",
              padding: "12px",
              border: "1px solid #2B313A",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "14px" }}>
                {p.platform}
              </span>
              <span style={{ fontSize: "11px", color: "#848E9C" }}>
                Slip: {p.slippageBps} bps
              </span>
            </div>

            <div style={{ marginBottom: "6px" }}>
              <div style={{ fontSize: "11px", color: "#848E9C" }}>Per-Share Price</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#F0B90B",
                  fontFamily: "monospace",
                }}
              >
                ${p.perSharePrice.slice(0, 8)}
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#848E9C" }}>
              Liquidity: ${(p.dexLiquidityUsd.split(".")[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#5E6673",
                marginTop: "4px",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {p.tokenAddress}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
