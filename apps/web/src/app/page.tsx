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
  AnimatedButton,
  MorphingModal,
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
  const [modalView, setModalView] = useState<"alpha-feed" | "settled" | null>(null);

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

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px 60px 24px" }}>
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
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0, letterSpacing: "-0.8px" }}>
                  Market Intelligence
                </h1>
                <p style={{ margin: "6px 0 0 0", color: "#848E9C", fontSize: "14px" }}>
                  Empirical per-share unit conversion & cross-platform basis radar on BNB Smart Chain
                </p>
              </div>

              {/* Action Controls & View Switcher */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <AnimatedButton
                  variant="gold"
                  size="sm"
                  onClick={() => setModalView("alpha-feed")}
                  style={{
                    borderRadius: "9999px",
                    fontWeight: 700,
                  }}
                >
                  ⚡ Query Paid Alpha ($0.02)
                </AnimatedButton>

                {/* View Switcher: Heatmap vs Screener Table */}
                <div
                  style={{
                    display: "inline-flex",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    padding: "3px",
                  }}
                >
                  <button
                    onClick={() => setViewMode("HEATMAP")}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "9999px",
                      border: "none",
                      backgroundColor: viewMode === "HEATMAP" ? "#1E232B" : "transparent",
                      color: viewMode === "HEATMAP" ? "#FFFFFF" : "#848E9C",
                      boxShadow: viewMode === "HEATMAP" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "none",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Heatmap Treemap
                  </button>
                  <button
                    onClick={() => setViewMode("SCREENER")}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "9999px",
                      border: "none",
                      backgroundColor: viewMode === "SCREENER" ? "#1E232B" : "transparent",
                      color: viewMode === "SCREENER" ? "#FFFFFF" : "#848E9C",
                      boxShadow: viewMode === "SCREENER" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "none",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Screener Table
                  </button>
                </div>
              </div>
            </div>

            {/* Sector Tabs (§6.3) */}
            <div style={{ marginBottom: "12px" }}>
              <SectorTabs activeSector={activeSector} onSectorChange={setActiveSector} />
            </div>

            {/* Web3 Anomaly Filters (§6.3) */}
            <div style={{ marginBottom: "16px" }}>
              <AnomalyFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            </div>

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

      {/* Morphing Modal for b402 Paid Alpha */}
      <MorphingModal viewId={modalView} onClose={() => setModalView(null)}>
        {modalView === "alpha-feed" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#FFFFFF" }}>
                ⚡ b402 Paid Alpha Feed Access
              </h3>
              <button
                type="button"
                onClick={() => setModalView(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#848E9C",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "13px", color: "#848E9C", lineHeight: 1.5, marginBottom: "20px" }}>
              Unlock real-time arbitrage spreads, cross-platform flow accumulation, and automated policy verification via b402 micro-settlement.
            </p>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                <span style={{ color: "#848E9C" }}>Cost per query:</span>
                <span style={{ color: "#F0B90B", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>0.02 USDC</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#848E9C" }}>Settlement Rail:</span>
                <span style={{ color: "#0ECB81", fontWeight: 600 }}>BNB Chain (b402 Shadow Gateway)</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <AnimatedButton
                variant="secondary"
                size="md"
                onClick={() => setModalView(null)}
                style={{ flex: 1, borderRadius: "10px" }}
              >
                Cancel
              </AnimatedButton>
              <AnimatedButton
                variant="gold"
                size="md"
                onClick={() => setModalView("settled")}
                style={{ flex: 1, borderRadius: "10px" }}
              >
                Sign & Pay 0.02 USDC
              </AnimatedButton>
            </div>
          </div>
        ) : modalView === "settled" ? (
          <div>
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(14, 203, 129, 0.15)",
                  border: "1px solid #0ECB81",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                  fontSize: "24px",
                  color: "#0ECB81",
                }}
              >
                ✓
              </div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700, color: "#FFFFFF" }}>
                Micro-Settlement Verified!
              </h3>
              <p style={{ fontSize: "13px", color: "#848E9C", lineHeight: 1.5, marginBottom: "16px" }}>
                Receipt registered on BNB Smart Chain. Full alpha stream unlocked with HMAC cryptographic signature.
              </p>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "#0ECB81",
                  backgroundColor: "rgba(14, 203, 129, 0.08)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  wordBreak: "break-all",
                }}
              >
                Tx: 0x8a92...ef41 | Block: #38,912,410
              </div>
              <AnimatedButton
                variant="gold"
                size="md"
                onClick={() => setModalView(null)}
                style={{ width: "100%", borderRadius: "10px" }}
              >
                Return to Dashboard
              </AnimatedButton>
            </div>
          </div>
        ) : null}
      </MorphingModal>
    </div>
  );
}
