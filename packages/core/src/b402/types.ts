// b402 V2 Protocol & Payment Gateway Types (§5.6, §9.3)

export type B402SupportedAsset = "USDC" | "USDT" | "USD1" | "U";
export type B402Network = "bsc" | "bsc-testnet";
export type B402GatewayMode = "official" | "shadow";

export interface BazaarMetadata {
  description: string;
  routeTemplate: string;
  info: {
    input: {
      type: "http";
      method: "GET" | "POST";
      pathParams?: Record<string, string>;
      queryParams?: Record<string, string>;
    };
  };
  schema: Record<string, unknown>;
}

export interface PaymentRequirementOption {
  scheme: "exact";
  asset: B402SupportedAsset;
  network: B402Network;
  amount: string; // Smallest units as unsigned decimal string (e.g. "10000" = 0.01 USDC)
  payTo: string;
  maxTimeoutSeconds?: number;
  extensions?: {
    bazaar?: BazaarMetadata;
    [key: string]: unknown;
  };
}

export interface B402PaymentRequirements {
  x402Version: 2;
  error: "Payment Required";
  accepts: PaymentRequirementOption[];
}

export interface B402PaymentPayload {
  x402Version: 2;
  payer: string;
  payTo: string;
  asset: B402SupportedAsset;
  amount: string;
  network: B402Network;
  nonce: string;
  deadline: number; // Unix timestamp in seconds
  signature: string; // EIP-712 or authorization signature
  extensions?: {
    bazaar?: BazaarMetadata;
    [key: string]: unknown;
  };
}

export interface B402VerifyRequest {
  body: {
    x402Version: 2;
    paymentPayload: B402PaymentPayload;
    paymentRequirements: PaymentRequirementOption;
  };
}

export interface B402VerifyResult {
  valid: boolean;
  code: string;
  reason?: string;
  payer?: string;
  amount?: string;
  asset?: B402SupportedAsset;
}

export interface B402SettleRequest {
  body: {
    x402Version: 2;
    paymentPayload: B402PaymentPayload;
    paymentRequirements: PaymentRequirementOption;
    settleAmount?: string;
  };
}

export interface B402SettleResult {
  settled: boolean;
  settlementId: string;
  txHash?: string;
  settledAt: number;
  amount: string;
  asset: B402SupportedAsset;
  mode: B402GatewayMode;
}

export interface PaymentGatewayConfig {
  mode?: B402GatewayMode;
  apiKey?: string;
  secretKey?: string;
  baseUrl?: string;
  payTo?: string;
  network?: B402Network;
}
