// packages/core/src/services/receipt.ts
//
// Receipt Service: Anchors agent decisions with verifiable SHA-256 hashes
// for on-chain anchoring via ReceiptRegistry.sol.
// Reference: Spectra.md §5.5, §10.4

import { createHash } from "crypto";
import type { ExecutionReceipt } from "../types/receipt.js";
import type { AlphaSignal } from "../types/signal.js";

export function computeSha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function hashDecision(signal: AlphaSignal, reasoning: string): string {
  const payload = JSON.stringify({
    signalId: signal.id,
    type: signal.type,
    ticker: signal.ticker,
    value: signal.value.toString(),
    context: signal.context,
    timestamp: signal.timestamp.toISOString(),
    reasoning,
  });
  return `0x${computeSha256(payload)}`;
}

export function hashSimulation(simulationResult: unknown): string {
  const payload = JSON.stringify(simulationResult ?? {});
  return `0x${computeSha256(payload)}`;
}

export function hashQuote(quote: unknown): string {
  const payload = JSON.stringify(quote ?? {});
  return `0x${computeSha256(payload)}`;
}

export class ReceiptService {
  private receipts: ExecutionReceipt[] = [];
  private userReceipts: Map<string, ExecutionReceipt[]> = new Map();

  createReceipt(params: {
    user: string;
    signal: AlphaSignal;
    reasoning: string;
    simulationResult: unknown;
    quote: unknown;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    expectedAmountOut: string;
    actualAmountOut: string;
    slippageBps: number;
    timestamp?: number;
  }): ExecutionReceipt {
    const decisionHash = hashDecision(params.signal, params.reasoning);
    const simulationHash = hashSimulation(params.simulationResult);
    const quoteHash = hashQuote(params.quote);

    const receipt: ExecutionReceipt = {
      decisionHash,
      simulationHash,
      quoteHash,
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      expectedAmountOut: params.expectedAmountOut,
      actualAmountOut: params.actualAmountOut,
      slippageBps: params.slippageBps,
      signalType: params.signal.type,
      timestamp: params.timestamp ?? Date.now(),
    };

    this.receipts.push(receipt);

    const userKey = params.user.toLowerCase();
    const existing = this.userReceipts.get(userKey) ?? [];
    existing.push(receipt);
    this.userReceipts.set(userKey, existing);

    return receipt;
  }

  getReceipts(): ExecutionReceipt[] {
    return this.receipts;
  }

  getReceiptsByUser(user: string): ExecutionReceipt[] {
    return this.userReceipts.get(user.toLowerCase()) ?? [];
  }
}
