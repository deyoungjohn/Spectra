// apps/web/src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  MarketStatusBanner,
  SectorTabs,
  AnomalyFilters,
  HeatmapView,
  ScreenerTable,
  TickerDetailView,
  type SectorType,
  type AnomalyFilterType,
  type ScreenerRow,
  type HeatmapItem,
} from "@spectra/ui";

// Mock baseline dataset based on empirical discoveries in Spectra.md §2.2
const INITIAL_STOCKS: ScreenerRow[] = [
  {
    ticker: "AAPL",
    platform: "ONDO",
    tokenAddress: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4",
    tokenPrice: "335.020000000000000000",
    perSharePrice: "333.892750000000000000",
    tradfiPrice: "333.900000000000000000",
    oracleDivergenceBps: "33",
    weekendPremiumBps: "0",
    crossPlatformBasisBps: "15",
    dexLiquidityUsd: "250000.000000000000000000",
    slippageBps: "15",
    marketStatus: "OPEN",
    activeSignalsCount: 2,
  },
  {
    ticker: "AAPL",
    platform: "BSTOCKS",
    tokenAddress: "0x1111111254fb6c44bac0bed2854e76f90643097d",
    tokenPrice: "334.600000000000000000",
    perSharePrice: "334.600000000000000000",
    tradfiPrice: "333.900000000000000000",
    oracleDivergenceBps: "21",
    weekendPremiumBps: "0",
    crossPlatformBasisBps: "15",
    dexLiquidityUsd: "180000.000000000000000000",
    slippageBps: "20",
    marketStatus: "OPEN",
    activeSignalsCount: 1,
  },
  {
    ticker: "NVDA",
    platform: "ONDO",
    tokenAddress: "0x2222222254fb6c44bac0bed2854e76f90643097d",
    tokenPrice: "125.500000000000000000",
    perSharePrice: "125.312000000000000000",
    tradfiPrice: "125.000000000000000000",
    oracleDivergenceBps: "25",
    weekendPremiumBps: "0",
    crossPlatformBasisBps: "23",
    dexLiquidityUsd: "500000.000000000000000000",
    slippageBps: "10",
    marketStatus: "OPEN",
    activeSignalsCount: 2,
  },
  {
    ticker: "NVDA",
    platform: "BSTOCKS",
    tokenAddress: "0x3333333354fb6c44bac0bed2854e76f90643097d",
    tokenPrice: "125.020000000000000000",
    perSharePrice: "125.020000000000000000",
    tradfiPrice: "125.000000000000000000",
    oracleDivergenceBps: "2",
    weekendPremiumBps: "0",
    crossPlatformBasisBps: "23",
    dexLiquidityUsd: "320000.000000000000000000",
    slippageBps: "18",
    marketStatus: "OPEN",
    activeSignalsCount: 1,
  },
  {
    ticker: "TSLA",
    platform: "XSTOCKS",
    tokenAddress: "0x4444444454fb6c44bac0bed2854e76f90643097d",
    tokenPrice: "248.500000000000000000",
    perSharePrice: "248.500000000000000000",
    tradfiPrice: "248.000000000000000000",
    oracleDivergenceBps: "20",
    weekendPremiumBps: "0",
    crossPlatformBasisBps: "0",
    dexLiquidityUsd: "120000.000000000000000000",
    slippageBps: "25",
    marketStatus: "OPEN",
    activeSignalsCount: 1,
  },
];

export default function MarketIntelDashboard() {
  const [activeSector, setActiveSector] = useState<SectorType>("ALL");
  const [activeFilter, setActiveFilter] = useState<AnomalyFilterType>("ALL");
  const [viewMode, setViewMode] = useState<"HEATMAP" | "SCREENER">("HEATMAP");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);

  useEffect(() => {
    setLastFetchTime(new Date().toISOString());
  }, []);

  // Filter stocks by activeSector and anomaly filter
  let displayedStocks = INITIAL_STOCKS;

  if (activeSector === "MAG7") {
    displayedStocks = displayedStocks.filter((s) => ["AAPL", "NVDA", "TSLA"].includes(s.ticker));
  } else if (activeSector === "AI_CHIPS") {
    displayedStocks = displayedStocks.filter((s) => s.ticker === "NVDA");
  }

  if (activeFilter === "ORACLE_DIVERGENCE") {
    displayedStocks = displayedStocks.filter((s) => (parseInt(s.oracleDivergenceBps, 10) || 0) >= 10);
  } else if (activeFilter === "CROSS_PLATFORM_BASIS") {
    displayedStocks = displayedStocks.filter((s) => (parseInt(s.crossPlatformBasisBps, 10) || 0) >= 20);
  }

  // Convert for heatmap view
  const heatmapItems: HeatmapItem[] = displayedStocks.map((s) => {
    const divBps = parseInt(s.oracleDivergenceBps, 10) || 0;
    let signalColor = "#0ECB81";
    if (divBps > 25) signalColor = "#F6465D";
    else if (divBps > 10) signalColor = "#F0B90B";

    return {
      ticker: s.ticker,
      platform: s.platform,
      perSharePrice: s.perSharePrice,
      tradfiPrice: s.tradfiPrice,
      oracleDivergenceBps: s.oracleDivergenceBps,
      crossPlatformBasisBps: s.crossPlatformBasisBps,
      signalColor,
      marketStatus: s.marketStatus,
      dexLiquidityUsd: s.dexLiquidityUsd,
    };
  });

  const selectedStock = selectedTicker
    ? INITIAL_STOCKS.find((s) => s.ticker === selectedTicker)
    : null;

  const selectedPlatforms = selectedTicker
    ? INITIAL_STOCKS.filter((s) => s.ticker === selectedTicker).map((s) => ({
        platform: s.platform,
        tokenAddress: s.tokenAddress,
        tokenPrice: s.tokenPrice,
        perSharePrice: s.perSharePrice,
        dexLiquidityUsd: s.dexLiquidityUsd,
        slippageBps: s.slippageBps,
      }))
    : [];

  return (
    <div>
      {/* Market Status Banner (§6.3) */}
      <MarketStatusBanner
        status="OPEN"
        isOpen={true}
        dataFeedAvailable={true}
        lastFetchTime={lastFetchTime}
      />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px 24px" }}>
        {/* Detail view overlay if ticker selected */}
        {selectedStock ? (
          <TickerDetailView
            ticker={selectedStock.ticker}
            perSharePrice={selectedStock.perSharePrice}
            tradfiPrice={selectedStock.tradfiPrice}
            oracleDivergenceBps={selectedStock.oracleDivergenceBps}
            marketStatus={selectedStock.marketStatus}
            platforms={selectedPlatforms}
            signals={[
              {
                id: "sig-1",
                type: "ORACLE_DIVERGENCE",
                severity: parseInt(selectedStock.oracleDivergenceBps, 10) > 25 ? "critical" : "warning",
                value: selectedStock.oracleDivergenceBps,
                actionable: true,
                regime: "OPEN",
              },
              {
                id: "sig-2",
                type: "BASIS",
                severity: "info",
                value: selectedStock.crossPlatformBasisBps,
                actionable: true,
                regime: "ANY",
              },
            ]}
            onBack={() => setSelectedTicker(null)}
          />
        ) : (
          <>
            {/* Dashboard Header Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
                  Market Intelligence
                </h1>
                <p style={{ margin: "4px 0 0 0", color: "#848E9C", fontSize: "13px" }}>
                  Empirical per-share unit conversion & cross-platform basis radar
                </p>
              </div>

              {/* View Switcher: Heatmap vs Screener Table */}
              <div
                style={{
                  display: "flex",
                  borderRadius: "6px",
                  backgroundColor: "#16181D",
                  border: "1px solid #23272E",
                  padding: "2px",
                }}
              >
                <button
                  onClick={() => setViewMode("HEATMAP")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: viewMode === "HEATMAP" ? "#2B313A" : "transparent",
                    color: viewMode === "HEATMAP" ? "#F0B90B" : "#848E9C",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Heatmap Treemap
                </button>
                <button
                  onClick={() => setViewMode("SCREENER")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: viewMode === "SCREENER" ? "#2B313A" : "transparent",
                    color: viewMode === "SCREENER" ? "#F0B90B" : "#848E9C",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Screener Table
                </button>
              </div>
            </div>

            {/* Sector Tabs (§6.3) */}
            <SectorTabs activeSector={activeSector} onSectorChange={setActiveSector} />

            {/* Web3 Anomaly Filters (§6.3) */}
            <AnomalyFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            {/* Main View Area */}
            {viewMode === "HEATMAP" ? (
              <HeatmapView
                items={heatmapItems}
                selectedTicker={selectedTicker}
                onSelectTicker={setSelectedTicker}
              />
            ) : (
              <ScreenerTable
                rows={displayedStocks}
                onSelectRow={setSelectedTicker}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
