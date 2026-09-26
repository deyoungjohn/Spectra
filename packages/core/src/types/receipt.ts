// packages/core/src/types/receipt.ts
//
// Execution receipt types for the Receipt Service.
// Reference: Spectra.md §5.5

/**
 * An execution receipt anchored on-chain via ReceiptRegistry.sol.
 * Every agent decision is recorded with verifiable hashes.
 */
export interface ExecutionReceipt {
  /** SHA-256 hash of signal + reasoning */
  decisionHash: string;

  /** SHA-256 hash of Transaction API simulation result */
  simulationHash: string;

  /** SHA-256 hash of Trading API quote */
  quoteHash: string;

  /** Input token address */
  tokenIn: string;

  /** Output token address */
  tokenOut: string;

  /** Amount sent in (18-decimal fixed-point string) */
  amountIn: string;

  /** Expected output amount (from quote) */
  expectedAmountOut: string;

  /** Actual output amount (from execution) */
  actualAmountOut: string;

  /** Realized slippage in bps */
  slippageBps: number;

  /** Which signal triggered this execution */
  signalType: string;

  /** Unix timestamp */
  timestamp: number;
}
