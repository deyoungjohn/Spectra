// packages/ui/src/strategy.test.tsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  TemplateGallery,
  NLInput,
  StrategyPreview,
  Simulator,
  ExecutionLog,
} from "./index.js";

describe("Strategy Forge UI Components", () => {
  describe("TemplateGallery", () => {
    const mockTemplates = [
      {
        id: "dca-weekly",
        name: "Weekly DCA",
        description: "Buy $10 every Monday",
        category: "DCA",
        defaultTicker: "AAPL",
        estimatedApyBps: 850,
      },
      {
        id: "basis-rotation",
        name: "Basis Rotation",
        description: "Rotate when basis > 20 bps",
        category: "ARBITRAGE",
        defaultTicker: "AAPL",
        estimatedApyBps: 1420,
      },
    ];

    it("renders templates and calls onSelectTemplate on click", () => {
      const onSelect = vi.fn();
      render(
        <TemplateGallery
          templates={mockTemplates}
          selectedTemplateId="dca-weekly"
          onSelectTemplate={onSelect}
        />
      );

      expect(screen.getByText("Weekly DCA")).toBeDefined();
      expect(screen.getByText("Basis Rotation")).toBeDefined();
      expect(screen.getByText("~8.5% APY")).toBeDefined();

      const basisCard = screen.getByTestId("template-card-basis-rotation");
      fireEvent.click(basisCard);
      expect(onSelect).toHaveBeenCalledWith("basis-rotation");
    });
  });

  describe("NLInput", () => {
    it("renders textarea and compiles input", () => {
      const onCompile = vi.fn();
      render(<NLInput onCompile={onCompile} />);

      const btn = screen.getByTestId("compile-btn");
      fireEvent.click(btn);
      expect(onCompile).toHaveBeenCalled();
    });

    it("sets preset example on chip click", () => {
      const onCompile = vi.fn();
      render(<NLInput onCompile={onCompile} />);

      const chip = screen.getByTestId("example-chip-1");
      fireEvent.click(chip);

      const textarea = screen.getByTestId("nl-input-textarea") as HTMLTextAreaElement;
      expect(textarea.value).toContain("TSLA");
    });
  });

  describe("StrategyPreview", () => {
    const mockDsl = {
      name: "AAPL Basis Rotation",
      trigger: { type: "CROSS_PLATFORM_BASIS_ABOVE", ticker: "AAPL", basisBps: "20" },
      action: { type: "ROTATE", ticker: "AAPL", fromPlatform: "ONDO", toPlatform: "BSTOCKS" },
      policy: { maxTradeNotionalUsd: "10.00", maxSlippageBps: "100" },
    };

    it("renders valid DSL and triggers simulation & deployment callbacks", () => {
      const onSimulate = vi.fn();
      const onDeploy = vi.fn();

      render(
        <StrategyPreview
          dsl={mockDsl}
          isValid={true}
          onSimulate={onSimulate}
          onDeploy={onDeploy}
        />
      );

      expect(screen.getByText(/VALID DSL/i)).toBeDefined();
      expect(screen.getByTestId("dsl-json-viewer").textContent).toContain("AAPL Basis Rotation");

      const simBtn = screen.getByTestId("simulate-btn");
      fireEvent.click(simBtn);
      expect(onSimulate).toHaveBeenCalled();

      const deployBtn = screen.getByTestId("deploy-btn");
      fireEvent.click(deployBtn);
      expect(onDeploy).toHaveBeenCalled();
    });
  });

  describe("Simulator", () => {
    it("renders simulation metrics and SHA-256 hash", () => {
      const mockResult = {
        strategyName: "AAPL Basis Rotation",
        triggered: true,
        triggerReason: "Basis is 25 bps (threshold: 20 bps)",
        simulatedPriceUsd: "334.60",
        estimatedSlippageBps: "15",
        estimatedFeeUsd: "0.03",
        netAmountOutUsd: "9.97",
        simulationHash: "89ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345678",
        timestamp: "2026-09-26T20:00:00Z",
        status: "SUCCESS" as const,
        policyCheckPassed: true,
      };

      render(<Simulator result={mockResult} />);

      expect(screen.getByTestId("simulation-status-badge").textContent).toBe("SUCCESS");
      expect(screen.getByTestId("trigger-status").textContent).toContain("Trigger Fired");
      expect(screen.getByTestId("simulation-hash").textContent).toContain("89ab12cd34");
    });
  });

  describe("ExecutionLog", () => {
    it("renders execution log rows with receipt hashes", () => {
      const mockExecs = [
        {
          id: "exec-1",
          strategyId: "strat-1",
          strategyName: "AAPL Basis Rotation",
          timestamp: "2026-09-26T20:00:00Z",
          actionType: "ROTATE",
          ticker: "AAPL",
          platform: "ONDO",
          amountUsd: "10.00",
          receiptHash: "0x89ab12cd34ef567890abcdef1234567890abcdef1234567890abcdef12345678",
          status: "CONFIRMED" as const,
        },
      ];

      render(<ExecutionLog executions={mockExecs} />);

      expect(screen.getByText("AAPL Basis Rotation")).toBeDefined();
      expect(screen.getByText("ROTATE")).toBeDefined();
      expect(screen.getByText("CONFIRMED")).toBeDefined();
      expect(screen.getByText(/0x89ab12/)).toBeDefined();
    });
  });
});
