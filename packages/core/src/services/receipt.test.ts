// packages/core/src/services/receipt.test.ts
import { describe, it, expect } from "vitest";
import {
  ReceiptService,
  hashDecision,
  hashSimulation,
  hashQuote,
} from "./receipt.js";
import type { AlphaSignal } from "../types/signal.js";

describe("ReceiptService", () => {
  const mockSignal: AlphaSignal = {
    id: "sig:123",
    type: "ORACLE_DIVERGENCE",
    ticker: "AAPL",
    severity: "critical",
    value: 28n,
    context: { spread: "28" },
    timestamp: new Date("2026-09-26T12:00:00Z"),
    actionable: true,
    regime: "OPEN",
  };

  it("produces deterministic 0x-prefixed 32-byte hex hashes", () => {
    const h1 = hashDecision(mockSignal, "Oracle diverged past 25 bps");
    const h2 = hashDecision(mockSignal, "Oracle diverged past 25 bps");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^0x[a-f0-9]{64}$/);

    const simHash = hashSimulation({ gasUsed: 120000, success: true });
    expect(simHash).toMatch(/^0x[a-f0-9]{64}$/);

    const quoteHash = hashQuote({ route: "PancakeSwapV3", price: "335.02" });
    expect(quoteHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("creates, stores, and looks up execution receipts", () => {
    const service = new ReceiptService();

    const receipt = service.createReceipt({
      user: "0xUserA",
      signal: mockSignal,
      reasoning: "Executing divergence guard rotation",
      simulationResult: { gasUsed: 50000 },
      quote: { route: "Direct" },
      tokenIn: "0xUSDC",
      tokenOut: "0xAAPL",
      amountIn: "10000000",
      expectedAmountOut: "29850",
      actualAmountOut: "29840",
      slippageBps: 3,
    });

    expect(receipt.decisionHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(receipt.signalType).toBe("ORACLE_DIVERGENCE");
    expect(receipt.amountIn).toBe("10000000");

    const userReceipts = service.getReceiptsByUser("0xUserA");
    expect(userReceipts).toHaveLength(1);
    expect(userReceipts[0]?.decisionHash).toBe(receipt.decisionHash);

    const emptyReceipts = service.getReceiptsByUser("0xOtherUser");
    expect(emptyReceipts).toHaveLength(0);
  });
});
