// Agent Layer Types per Spectra.md §9
// BNB Agent Studio (ERC-8004 identity & ERC-8183 task interface)
// Agentic Wallet skills (get-quote, swap, get-balances, simulate-transaction)

export interface Erc8004Identity {
  agentId: string;
  name: string;
  version: string;
  description: string;
  ownerAddress: string;
  agentAddress: string;
  metadataUri: string;
  capabilities: string[];
  policyConstraints: {
    maxTradeNotionalUsd: string;
    maxSlippageBps: number;
    killSwitchActive: boolean;
  };
  registeredAt: number;
  signature?: string;
}

export type Erc8183TaskStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface Erc8183Task<TInput = Record<string, unknown>, TOutput = Record<string, unknown>> {
  taskId: string;
  creator: string;
  executor: string;
  taskType: string;
  inputPayload: TInput;
  status: Erc8183TaskStatus;
  outputPayload?: TOutput;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QuoteRequest {
  fromAsset: string;
  toAsset: string;
  amountIn: string;
  slippageBps?: number;
}

export interface QuoteResponse {
  quoteId: string;
  route: string[];
  fromAsset: string;
  toAsset: string;
  amountIn: string;
  amountOut: string;
  minAmountOut: string;
  priceImpactBps: number;
  dex: "PancakeSwap_v3" | "UniswapV3_BSC" | "Thena";
  estimatedGasUsd: string;
}

export interface SwapRequest {
  quoteId?: string;
  fromAsset: string;
  toAsset: string;
  amountIn: string;
  minAmountOut: string;
  recipient: string;
  slippageBps?: number;
}

export interface SwapResponse {
  txHash: string;
  fromAsset: string;
  toAsset: string;
  amountIn: string;
  amountOut: string;
  blockNumber: number;
  gasUsed: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED_BY_POLICY";
  revertReason?: string;
  timestamp: number;
}

export interface AssetBalance {
  symbol: string;
  balance: string;
  decimals: number;
  formatted: string;
}

export interface WalletBalancesResponse {
  walletAddress: string;
  balances: Record<string, AssetBalance>;
  timestamp: number;
}

export interface SimulateTxRequest {
  from: string;
  to: string;
  data: string;
  value?: string;
}

export interface SimulateTxResponse {
  success: boolean;
  gasEstimate: string;
  logs: string[];
  stateDiff?: Record<string, unknown>;
  revertReason?: string;
}
