// packages/ui/src/flow.test.tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FlowDashboard,
  TickerFlowChart,
  WhaleTable,
  CrossPlatformFlow,
} from "./index.js";

describe("Flow UI Components", () => {
  describe("FlowDashboard", () => {
    it("renders total market net flow and top accumulators/distributors", () => {
      const onSelect = vi.fn();
      render(
        <FlowDashboard
          totalMarketNetFlow24hUsd="142500.50"
          topAccumulated={[
            { ticker: "AAPL", netFlow24hUsd: "54200.00", dominantPlatform: "ONDO" },
            { ticker: "MSFT", netFlow24hUsd: "32100.00", dominantPlatform: "BSTOCKS" },
          ]}
          topDistributed={[
            { ticker: "NVDA", netFlow24hUsd: "-26000.00", dominantPlatform: "ONDO" },
          ]}
          onSelectTicker={onSelect}
        />
      );

      expect(screen.getByText(/\+\$142,500\.50/)).toBeDefined();
      expect(screen.getByText("AAPL")).toBeDefined();
      expect(screen.getByText("NVDA")).toBeDefined();

      const aaplRow = screen.getByTestId("accum-item-AAPL");
      fireEvent.click(aaplRow);
      expect(onSelect).toHaveBeenCalledWith("AAPL");
    });

    it("renders stale banner when isStale is true", () => {
      render(
        <FlowDashboard
          totalMarketNetFlow24hUsd="0"
          topAccumulated={[]}
          topDistributed={[]}
          isStale={true}
          lastUpdated="2026-09-26T20:00:00Z"
        />
      );

      expect(screen.getByTestId("flow-stale-banner")).toBeDefined();
    });
  });

  describe("TickerFlowChart", () => {
    const mockPoints = [
      { timestamp: "2026-09-26T18:00:00Z", inflowUsd: "10000.00", outflowUsd: "2000.00", netFlowUsd: "8000.00" },
      { timestamp: "2026-09-26T19:00:00Z", inflowUsd: "1000.00", outflowUsd: "5000.00", netFlowUsd: "-4000.00" },
    ];

    it("renders ticker and chart bars", () => {
      render(
        <TickerFlowChart
          ticker="AAPL"
          points={mockPoints}
        />
      );

      expect(screen.getByText(/AAPL Net Smart Money Flow/i)).toBeDefined();
      expect(screen.getByTestId("flow-chart-container")).toBeDefined();
    });

    it("shows pre-event positioning badge when active", () => {
      render(
        <TickerFlowChart
          ticker="AAPL"
          points={mockPoints}
          preEventPositioning={true}
        />
      );

      expect(screen.getByTestId("pre-event-badge")).toBeDefined();
    });

    it("triggers window selection callback", () => {
      const onSelectWindow = vi.fn();
      render(
        <TickerFlowChart
          ticker="AAPL"
          points={mockPoints}
          selectedWindow="24h"
          onSelectWindow={onSelectWindow}
        />
      );

      const btn4h = screen.getByText("4h");
      fireEvent.click(btn4h);
      expect(onSelectWindow).toHaveBeenCalledWith("4h");
    });
  });

  describe("WhaleTable", () => {
    it("renders whale movements with amounts and links", () => {
      const onSelectTicker = vi.fn();
      const mockAlerts = [
        {
          id: "whale-1",
          hash: "0x1a8f93e4b78c9012a456d8ef1234567890abcdef1234567890abcdef12345671",
          timestamp: "2026-09-26T20:00:00Z",
          ticker: "AAPL",
          platform: "ONDO",
          wallet: "0x71C65E5f16252F90F2b876632431264b4c818B29",
          walletLabel: "Whale 0x71C6...8B29",
          direction: "INFLOW" as const,
          amountTokens: "50.00",
          amountUsd: "16751.00",
        },
      ];

      render(
        <WhaleTable
          alerts={mockAlerts}
          onSelectTicker={onSelectTicker}
        />
      );

      expect(screen.getByText("Whale 0x71C6...8B29")).toBeDefined();
      expect(screen.getByText(/INFLOW/)).toBeDefined();
      expect(screen.getByText(/\+\$16,751\.00/)).toBeDefined();

      const tickerSpan = screen.getByText("AAPL");
      fireEvent.click(tickerSpan);
      expect(onSelectTicker).toHaveBeenCalledWith("AAPL");
    });

    it("renders empty message when no alerts", () => {
      render(<WhaleTable alerts={[]} />);
      expect(screen.getByText(/No whale movements detected/i)).toBeDefined();
    });
  });

  describe("CrossPlatformFlow", () => {
    it("renders all platform venues and highlights dominant platform", () => {
      render(
        <CrossPlatformFlow
          ticker="AAPL"
          ondoNetFlowUsd="35000.00"
          bStocksNetFlowUsd="12000.00"
          xStocksNetFlowUsd="5000.00"
          totalNetFlowUsd="52000.00"
          dominantPlatform="ONDO"
        />
      );

      expect(screen.getByText(/AAPL Cross-Platform Flow Routing/i)).toBeDefined();
      expect(screen.getByTestId("dominant-venue-badge").textContent).toBe("ONDO");
      expect(screen.getByTestId("venue-card-ONDO")).toBeDefined();
      expect(screen.getByTestId("venue-card-BSTOCKS")).toBeDefined();
      expect(screen.getByTestId("venue-card-XSTOCKS")).toBeDefined();
    });
  });
});
