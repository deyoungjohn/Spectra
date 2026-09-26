// packages/ui/src/loop.test.tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnifiedLoopNav, TickerTape } from "./index.js";

describe("Unified Loop UI Components", () => {
  describe("UnifiedLoopNav", () => {
    it("renders all 4 stages: SEE, READ, FORGE, PROVE", () => {
      render(<UnifiedLoopNav currentStep={1} />);

      expect(screen.getByText("SEE")).toBeDefined();
      expect(screen.getByText("READ")).toBeDefined();
      expect(screen.getByText("FORGE")).toBeDefined();
      expect(screen.getByText("PROVE")).toBeDefined();
    });

    it("highlights the active step and marks completed steps with checkmark", () => {
      render(
        <UnifiedLoopNav
          currentStep={3}
          completedSteps={[1, 2]}
        />
      );

      const step1 = screen.getByTestId("loop-step-1");
      const step2 = screen.getByTestId("loop-step-2");
      const step3 = screen.getByTestId("loop-step-3");

      expect(step1.textContent).toContain("✓");
      expect(step2.textContent).toContain("✓");
      expect(step3.textContent).toContain("3");
    });

    it("triggers onSelectStep when clicking a step", () => {
      const onSelect = vi.fn();
      render(
        <UnifiedLoopNav
          currentStep={2}
          onSelectStep={onSelect}
        />
      );

      const forgeBtn = screen.getByTestId("loop-step-3");
      fireEvent.click(forgeBtn);

      expect(onSelect).toHaveBeenCalledWith(3);
    });
  });

  describe("TickerTape", () => {
    it("renders market status pill, WS status badge, and signal stream", () => {
      render(
        <TickerTape
          wsStatus="CONNECTED"
          marketOpen={true}
          lastUpdated="2s ago"
        />
      );

      expect(screen.getByTestId("market-status-pill").textContent).toContain("US MARKET OPEN");
      expect(screen.getByTestId("ws-status-badge").textContent).toContain("WS: CONNECTED");
      expect(screen.getByTestId("last-updated").textContent).toBe("2s ago");
      expect(screen.getByTestId("signal-pill-tsla")).toBeDefined();
      expect(screen.getByTestId("signal-pill-tsla").textContent).toContain("TSLA");
    });

    it("renders closed market status when marketOpen is false", () => {
      render(
        <TickerTape
          marketOpen={false}
          wsStatus="CONNECTING"
        />
      );

      expect(screen.getByTestId("market-status-pill").textContent).toContain("MARKET CLOSED (FROZEN)");
      expect(screen.getByTestId("ws-status-badge").textContent).toContain("WS: CONNECTING");
    });

    it("calls onSelectSignal when signal chip is clicked", () => {
      const onSelect = vi.fn();
      render(<TickerTape onSelectSignal={onSelect} />);

      const tslaPill = screen.getByTestId("signal-pill-tsla");
      fireEvent.click(tslaPill);

      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ ticker: "TSLA" })
      );
    });
  });
});
