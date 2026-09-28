// apps/web/src/app/flow/page.tsx
"use client";

import React, { useState } from "react";
import {
  FlowDashboard,
  TickerFlowChart,
  WhaleTable,
  CrossPlatformFlow,
  AnimatedTabs,
  type FlowChartPoint,
  type WhaleAlertRow,
} from "@spectra/ui";

const INITIAL_SUMMARY = {
  totalMarketNetFlow24hUsd: "142500.50",
  topAccumulated: [
    { ticker: "AAPL", netFlow24hUsd: "54200.00", dominantPlatform: "ONDO" },
    { ticker: "MSFT", netFlow24hUsd: "32100.00", dominantPlatform: "BSTOCKS" },
    { ticker: "TSLA", netFlow24hUsd: "18500.00", dominantPlatform: "ONDO" },
  ],
  topDistributed: [
    { ticker: "NVDA", netFlow24hUsd: "-26000.00", dominantPlatform: "ONDO" },
  ],
  isStale: false,
  lastUpdated: new Date().toISOString(),
};

const MOCK_CHART_POINTS: Record<string, FlowChartPoint[]> = {
  AAPL: [
    { timestamp: "2026-09-26T16:00:00Z", inflowUsd: "12000.00", outflowUsd: "3000.00", netFlowUsd: "9000.00" },
    { timestamp: "2026-09-26T17:00:00Z", inflowUsd: "15000.00", outflowUsd: "4500.00", netFlowUsd: "10500.00" },
    { timestamp: "2026-09-26T18:00:00Z", inflowUsd: "22000.00", outflowUsd: "5200.00", netFlowUsd: "16800.00" },
    { timestamp: "2026-09-26T19:00:00Z", inflowUsd: "18000.00", outflowUsd: "6000.00", netFlowUsd: "12000.00" },
    { timestamp: "2026-09-26T20:00:00Z", inflowUsd: "14000.00", outflowUsd: "8100.00", netFlowUsd: "5900.00" },
  ],
  NVDA: [
    { timestamp: "2026-09-26T16:00:00Z", inflowUsd: "4000.00", outflowUsd: "12000.00", netFlowUsd: "-8000.00" },
    { timestamp: "2026-09-26T17:00:00Z", inflowUsd: "2000.00", outflowUsd: "15000.00", netFlowUsd: "-13000.00" },
    { timestamp: "2026-09-26T18:00:00Z", inflowUsd: "6000.00", outflowUsd: "11000.00", netFlowUsd: "-5000.00" },
  ],
  TSLA: [
    { timestamp: "2026-09-26T18:00:00Z", inflowUsd: "9500.00", outflowUsd: "2000.00", netFlowUsd: "7500.00" },
    { timestamp: "2026-09-26T19:00:00Z", inflowUsd: "13000.00", outflowUsd: "2000.00", netFlowUsd: "11000.00" },
  ],
  MSFT: [
    { timestamp: "2026-09-26T18:00:00Z", inflowUsd: "12000.00", outflowUsd: "3400.00", netFlowUsd: "8600.00" },
    { timestamp: "2026-09-26T19:00:00Z", inflowUsd: "25000.00", outflowUsd: "1500.00", netFlowUsd: "23500.00" },
  ],
};

const MOCK_WHALE_ALERTS: WhaleAlertRow[] = [
  {
    id: "whale-1",
    hash: "0x1a8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345671",
    timestamp: "2026-09-26T20:15:00Z",
    ticker: "AAPL",
    platform: "ONDO",
    wallet: "0x71C65E5f16252F90F2b876632431264b4c818B29",
    walletLabel: "Whale 0x71C6...8B29",
    direction: "INFLOW",
    amountTokens: "50.00",
    amountUsd: "16751.00",
  },
  {
    id: "whale-2",
    hash: "0x3c8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345673",
    timestamp: "2026-09-26T19:45:00Z",
    ticker: "NVDA",
    platform: "ONDO",
    wallet: "0x3aF89E198302fD271926673193a0283084C991c1",
    walletLabel: "Whale 0x3aF8...91c1",
    direction: "OUTFLOW",
    amountTokens: "200.00",
    amountUsd: "26000.00",
  },
  {
    id: "whale-3",
    hash: "0x4d8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345674",
    timestamp: "2026-09-26T20:30:00Z",
    ticker: "MSFT",
    platform: "ONDO",
    wallet: "0x88B1c9012a456d8ef1234567890abcdef123A102",
    walletLabel: "Whale 0x88B1...A102",
    direction: "INFLOW",
    amountTokens: "20.00",
    amountUsd: "8600.00",
  },
];

const MOCK_CROSS_PLATFORM: Record<string, { ondo: string; bstocks: string; xstocks: string; total: string; dominant: string }> = {
  AAPL: { ondo: "35000.00", bstocks: "12000.00", xstocks: "7200.00", total: "54200.00", dominant: "ONDO" },
  NVDA: { ondo: "-26000.00", bstocks: "0.00", xstocks: "0.00", total: "-26000.00", dominant: "ONDO" },
  TSLA: { ondo: "14000.00", bstocks: "4500.00", xstocks: "0.00", total: "18500.00", dominant: "ONDO" },
  MSFT: { ondo: "18000.00", bstocks: "14100.00", xstocks: "0.00", total: "32100.00", dominant: "ONDO" },
};

export default function FlowRadarPage() {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [selectedWindow, setSelectedWindow] = useState<"1h" | "4h" | "24h">("24h");

  const tickers = ["AAPL", "NVDA", "TSLA", "MSFT"];
  const currentChartPoints = MOCK_CHART_POINTS[selectedTicker] || [];
  const currentCross = MOCK_CROSS_PLATFORM[selectedTicker] || {
    ondo: "0.00",
    bstocks: "0.00",
    xstocks: "0.00",
    total: "0.00",
    dominant: "ONDO",
  };
  const filteredAlerts = MOCK_WHALE_ALERTS.filter(
    (a) => a.ticker === selectedTicker,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Title & Introduction */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#EAECEF" }}>
            Flow Radar <span style={{ color: "#F0B90B", fontSize: "16px", fontWeight: 600 }}>The Quiver Quant Layer</span>
          </h1>
          <p style={{ margin: "6px 0 0", color: "#848E9C", fontSize: "14px" }}>
            Real-time BSC token transfer tracking, whale accumulation alerts, and cross-platform liquidity migration.
          </p>
        </div>

        {/* b402 Alpha Endpoint Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 14px",
            backgroundColor: "#20252E",
            border: "1px solid #2B313A",
            borderRadius: "6px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "11px", color: "#848E9C" }}>API Access (b402 Paid Endpoint)</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#0ECB81", fontWeight: 700 }}>
              GET /api/alpha/flow/:ticker • 0.02 USDC
            </span>
          </div>
          <a
            href={`/api/alpha/flow/${selectedTicker}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 12px",
              backgroundColor: "#F0B90B",
              color: "#0D0E12",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Query Alpha
          </a>
        </div>
      </div>

      {/* Main Flow Dashboard Cards */}
      <FlowDashboard
        totalMarketNetFlow24hUsd={INITIAL_SUMMARY.totalMarketNetFlow24hUsd}
        topAccumulated={INITIAL_SUMMARY.topAccumulated}
        topDistributed={INITIAL_SUMMARY.topDistributed}
        isStale={INITIAL_SUMMARY.isStale}
        lastUpdated={INITIAL_SUMMARY.lastUpdated}
        onSelectTicker={(t) => setSelectedTicker(t)}
      />

      {/* Ticker Selector Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid #2B313A", paddingBottom: "16px", marginTop: "16px" }}>
        <span style={{ fontSize: "14px", color: "#848E9C", fontWeight: 600 }}>Inspect Equity Flow:</span>
        <AnimatedTabs
          tabs={tickers.map((t) => ({ id: t, label: t }))}
          activeTab={selectedTicker}
          onChange={setSelectedTicker}
        />
      </div>

      {/* Detailed Ticker Analysis Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
        {/* Net Flow Chart */}
        <TickerFlowChart
          ticker={selectedTicker}
          points={currentChartPoints}
          preEventPositioning={selectedTicker === "AAPL"}
          selectedWindow={selectedWindow}
          onSelectWindow={setSelectedWindow}
        />

        {/* Cross-Platform Flow */}
        <CrossPlatformFlow
          ticker={selectedTicker}
          ondoNetFlowUsd={currentCross.ondo}
          bStocksNetFlowUsd={currentCross.bstocks}
          xStocksNetFlowUsd={currentCross.xstocks}
          totalNetFlowUsd={currentCross.total}
          dominantPlatform={currentCross.dominant}
        />
      </div>

      {/* Whale Table */}
      <WhaleTable
        alerts={filteredAlerts.length > 0 ? filteredAlerts : MOCK_WHALE_ALERTS}
        onSelectTicker={(t) => setSelectedTicker(t)}
      />
    </div>
  );
}
