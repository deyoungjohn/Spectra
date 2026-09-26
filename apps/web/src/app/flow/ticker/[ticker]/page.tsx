// apps/web/src/app/flow/ticker/[ticker]/page.tsx
"use client";

import React, { use } from "react";
import {
  TickerFlowChart,
  CrossPlatformFlow,
  WhaleTable,
  type FlowChartPoint,
  type WhaleAlertRow,
} from "@spectra/ui";

export default function TickerFlowPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const resolvedParams = use(params);
  const ticker = resolvedParams.ticker.toUpperCase();

  const mockPoints: FlowChartPoint[] = [
    { timestamp: "2026-09-26T16:00:00Z", inflowUsd: "12000.00", outflowUsd: "3000.00", netFlowUsd: "9000.00" },
    { timestamp: "2026-09-26T17:00:00Z", inflowUsd: "15000.00", outflowUsd: "4500.00", netFlowUsd: "10500.00" },
    { timestamp: "2026-09-26T18:00:00Z", inflowUsd: "22000.00", outflowUsd: "5200.00", netFlowUsd: "16800.00" },
    { timestamp: "2026-09-26T19:00:00Z", inflowUsd: "18000.00", outflowUsd: "6000.00", netFlowUsd: "12000.00" },
    { timestamp: "2026-09-26T20:00:00Z", inflowUsd: "14000.00", outflowUsd: "8100.00", netFlowUsd: "5900.00" },
  ];

  const mockWhales: WhaleAlertRow[] = [
    {
      id: "whale-1",
      hash: "0x1a8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345671",
      timestamp: "2026-09-26T20:15:00Z",
      ticker,
      platform: "ONDO",
      wallet: "0x71C65E5f16252F90F2b876632431264b4c818B29",
      walletLabel: "Whale 0x71C6...8B29",
      direction: "INFLOW",
      amountTokens: "50.00",
      amountUsd: "16751.00",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a
          href="/flow"
          style={{
            color: "#848E9C",
            textDecoration: "none",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          ← Back to Flow Radar
        </a>

        <div style={{ display: "flex", gap: "10px" }}>
          <a
            href={`/market/ticker/${ticker}`}
            style={{
              padding: "6px 12px",
              backgroundColor: "#20252E",
              border: "1px solid #2B313A",
              color: "#EAECEF",
              borderRadius: "4px",
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            View Market Screener
          </a>
          <button
            type="button"
            onClick={() => alert(`Opening Strategy Forge with trigger: ${ticker} FLOW_ACCUMULATION_ABOVE $5k`)}
            style={{
              padding: "6px 14px",
              backgroundColor: "#F0B90B",
              border: "none",
              borderRadius: "4px",
              color: "#0D0E12",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⚡ Forge Strategy on Flow
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
        <TickerFlowChart
          ticker={ticker}
          points={mockPoints}
          preEventPositioning={ticker === "AAPL"}
        />

        <CrossPlatformFlow
          ticker={ticker}
          ondoNetFlowUsd="35000.00"
          bStocksNetFlowUsd="12000.00"
          xStocksNetFlowUsd="7200.00"
          totalNetFlowUsd="54200.00"
          dominantPlatform="ONDO"
        />
      </div>

      <WhaleTable alerts={mockWhales} />
    </div>
  );
}
