// apps/web/src/app/market/ticker/[ticker]/page.tsx
"use client";

import React, { use } from "react";
import { TickerDetailView } from "@spectra/ui";

export default function TickerPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const resolvedParams = use(params);
  const ticker = resolvedParams.ticker.toUpperCase();

  // Benchmark data for the ticker
  const mockPlatforms = [
    {
      platform: "ONDO",
      tokenAddress: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4",
      tokenPrice: "335.020000000000000000",
      perSharePrice: "333.892750000000000000",
      dexLiquidityUsd: "250000.000000000000000000",
      slippageBps: "15",
    },
    {
      platform: "BSTOCKS",
      tokenAddress: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      tokenPrice: "334.600000000000000000",
      perSharePrice: "334.600000000000000000",
      dexLiquidityUsd: "180000.000000000000000000",
      slippageBps: "20",
    },
  ];

  const mockSignals = [
    {
      id: "sig-1",
      type: "ORACLE_DIVERGENCE",
      severity: "warning",
      value: "21",
      actionable: true,
      regime: "OPEN",
    },
    {
      id: "sig-2",
      type: "BASIS",
      severity: "info",
      value: "15",
      actionable: true,
      regime: "ANY",
    },
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
      <TickerDetailView
        ticker={ticker}
        perSharePrice="333.89275"
        tradfiPrice="333.90000"
        oracleDivergenceBps="21"
        marketStatus="OPEN"
        platforms={mockPlatforms}
        signals={mockSignals}
        onForgeStrategy={() => {
          window.location.href = "/forge";
        }}
        onBack={() => {
          window.location.href = "/";
        }}
      />
    </div>
  );
}
