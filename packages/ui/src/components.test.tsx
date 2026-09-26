// packages/ui/src/components.test.tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MarketStatusBanner,
  AnomalyFilters,
  SectorTabs,
  HeatmapView,
  ScreenerTable,
  PlatformComparison,
  TickerDetailView,
} from "./index.js";

describe("MarketStatusBanner", () => {
  it("renders OPEN market status", () => {
    render(<MarketStatusBanner status="OPEN" isOpen={true} />);
    expect(screen.getByText(/TRADFI US EQUITIES: OPEN/i)).toBeDefined();
  });

  it("renders feed delayed alert when dataFeedAvailable is false (§5.10)", () => {
    render(
      <MarketStatusBanner
        status="OPEN"
        isOpen={true}
        dataFeedAvailable={false}
      />
    );
    expect(screen.getByText(/DATA FEED DELAYED/i)).toBeDefined();
  });
});

describe("AnomalyFilters", () => {
  it("renders filter chips and triggers onFilterChange callback", () => {
    const onFilterChange = vi.fn();
    render(
      <AnomalyFilters
        activeFilter="ALL"
        onFilterChange={onFilterChange}
        weekendPremiumEnabled={false}
      />
    );

    const oracleBtn = screen.getByText(/Oracle Divergence/i);
    expect(oracleBtn).toBeDefined();
    fireEvent.click(oracleBtn);
    expect(onFilterChange).toHaveBeenCalledWith("ORACLE_DIVERGENCE");

    // Weekend premium should show LOCKED badge
    expect(screen.getByText("LOCKED")).toBeDefined();
  });
});

describe("SectorTabs", () => {
  it("renders sector tabs and changes active sector", () => {
    const onSectorChange = vi.fn();
    render(<SectorTabs activeSector="ALL" onSectorChange={onSectorChange} />);

    const mag7Tab = screen.getByText("Magnificent 7");
    fireEvent.click(mag7Tab);
    expect(onSectorChange).toHaveBeenCalledWith("MAG7");
  });
});

describe("HeatmapView", () => {
  it("renders stock tiles with per-share price and triggers onSelectTicker", () => {
    const onSelect = vi.fn();
    const items = [
      {
        ticker: "AAPL",
        platform: "ONDO",
        perSharePrice: "333.892750",
        tradfiPrice: "333.900000",
        oracleDivergenceBps: "33",
        crossPlatformBasisBps: "15",
        signalColor: "#0ECB81",
        marketStatus: "OPEN",
        dexLiquidityUsd: "250000",
      },
    ];

    render(<HeatmapView items={items} onSelectTicker={onSelect} />);
    const tile = screen.getByText("AAPL");
    expect(tile).toBeDefined();
    fireEvent.click(tile);
    expect(onSelect).toHaveBeenCalledWith("AAPL");
  });
});

describe("ScreenerTable", () => {
  it("renders table rows with prices and handles row click", () => {
    const onSelect = vi.fn();
    const rows = [
      {
        ticker: "NVDA",
        platform: "BSTOCKS",
        tokenAddress: "0x123",
        tokenPrice: "125.020000",
        perSharePrice: "125.020000",
        tradfiPrice: "125.000000",
        oracleDivergenceBps: "2",
        weekendPremiumBps: "0",
        crossPlatformBasisBps: "10",
        dexLiquidityUsd: "320000",
        slippageBps: "18",
        marketStatus: "OPEN",
      },
    ];

    render(<ScreenerTable rows={rows} onSelectRow={onSelect} />);
    expect(screen.getByText("NVDA")).toBeDefined();
    const inspectBtn = screen.getByText("Inspect");
    fireEvent.click(inspectBtn);
    expect(onSelect).toHaveBeenCalledWith("NVDA");
  });
});

describe("PlatformComparison", () => {
  it("renders side-by-side platform quotes", () => {
    const platforms = [
      {
        platform: "ONDO",
        tokenAddress: "0x111",
        tokenPrice: "335.02",
        perSharePrice: "333.89",
        dexLiquidityUsd: "250000",
        slippageBps: "15",
      },
      {
        platform: "BSTOCKS",
        tokenAddress: "0x222",
        tokenPrice: "334.60",
        perSharePrice: "334.60",
        dexLiquidityUsd: "180000",
        slippageBps: "20",
      },
    ];

    render(<PlatformComparison ticker="AAPL" platforms={platforms} tradfiPrice="333.90" />);
    expect(screen.getByText(/AAPL Cross-Platform Comparison/i)).toBeDefined();
    expect(screen.getByText("ONDO")).toBeDefined();
    expect(screen.getByText("BSTOCKS")).toBeDefined();
  });
});

describe("TickerDetailView", () => {
  it("renders full detail view with action buttons", () => {
    const onForge = vi.fn();
    const onBack = vi.fn();

    render(
      <TickerDetailView
        ticker="AAPL"
        perSharePrice="333.8927"
        tradfiPrice="333.9000"
        oracleDivergenceBps="33"
        marketStatus="OPEN"
        platforms={[]}
        signals={[
          {
            id: "s1",
            type: "ORACLE_DIVERGENCE",
            severity: "critical",
            value: "33",
            actionable: true,
            regime: "OPEN",
          },
        ]}
        onForgeStrategy={onForge}
        onBack={onBack}
      />
    );

    expect(screen.getByText("AAPL")).toBeDefined();
    expect(screen.getByText(/Forge Strategy/i)).toBeDefined();
    fireEvent.click(screen.getByText(/Forge Strategy/i));
    expect(onForge).toHaveBeenCalledWith("AAPL");

    fireEvent.click(screen.getByText(/Back to Heatmap/i));
    expect(onBack).toHaveBeenCalled();
  });
});
