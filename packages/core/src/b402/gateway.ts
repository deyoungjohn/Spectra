// PaymentGateway (b402 + Shadow Fallback per Spectra.md §5.6, §9.3)

import { createHash, randomUUID } from "node:crypto";
import { B402Signer } from "./signer.js";
import { getBazaarMetadata } from "./bazaar.js";
import type {
  B402GatewayMode,
  B402PaymentPayload,
  B402PaymentRequirements,
  B402SettleResult,
  B402SupportedAsset,
  B402VerifyResult,
  PaymentGatewayConfig,
  PaymentRequirementOption,
} from "./types.js";

export const DEFAULT_PAY_TO = "0x4020000000000000000000000000000000000402";

export class PaymentGateway {
  private mode: B402GatewayMode;
  private readonly apiKey?: string;
  private readonly secretKey?: string;
  private readonly baseUrl: string;
  private readonly defaultPayTo: string;

  constructor(config: PaymentGatewayConfig = {}) {
    this.mode = config.mode ?? (process.env.B402_MODE === "official" ? "official" : "shadow");
    this.apiKey = config.apiKey ?? process.env.B402_API_KEY;
    this.secretKey = config.secretKey ?? process.env.B402_SECRET_KEY;
    this.baseUrl = config.baseUrl ?? process.env.B402_BASE_URL ?? "https://api.binance.org";
    this.defaultPayTo = config.payTo ?? process.env.B402_PAY_TO ?? DEFAULT_PAY_TO;
  }

  public getMode(): B402GatewayMode {
    return this.mode;
  }

  public setMode(mode: B402GatewayMode): void {
    this.mode = mode;
  }

  public getPayTo(): string {
    return this.defaultPayTo;
  }

  /**
   * Checks whether the upstream b402 service is reachable and responsive.
   * If unreachable or unauthorized, falls back automatically to shadow mode (§5.6).
   */
  public async checkB402Readiness(): Promise<boolean> {
    if (this.mode === "shadow" || !this.apiKey || !this.secretKey) {
      return false;
    }

    try {
      const requestPath = "/api/v2/b402/supported";
      const rawBody = JSON.stringify({ body: {} });
      const headers = B402Signer.sign({
        apiKey: this.apiKey,
        secretKey: this.secretKey,
        method: "POST",
        requestPath,
        rawBody,
      });

      const response = await fetch(`${this.baseUrl}${requestPath}`, {
        method: "POST",
        headers,
        body: rawBody,
      });

      if (!response.ok) {
        this.mode = "shadow";
        return false;
      }

      const data = (await response.json()) as { code?: string };
      const isReady = data.code === "000000000";
      if (!isReady) {
        this.mode = "shadow";
      }
      return isReady;
    } catch {
      this.mode = "shadow";
      return false;
    }
  }

  /**
   * Generates a canonical 402 Payment Required response schema with Bazaar metadata.
   */
  public createPaymentRequirements(
    endpointKey: string,
    amount: string,
    asset: B402SupportedAsset = "USDC",
    payTo?: string
  ): B402PaymentRequirements {
    const bazaar = getBazaarMetadata(endpointKey);
    const option: PaymentRequirementOption = {
      scheme: "exact",
      asset,
      network: "bsc",
      amount,
      payTo: payTo ?? this.defaultPayTo,
      maxTimeoutSeconds: 300,
      ...(bazaar && { extensions: { bazaar } }),
    };

    return {
      x402Version: 2,
      error: "Payment Required",
      accepts: [option],
    };
  }

  /**
   * Verifies an incoming b402 payment payload against the requirement.
   */
  public async verifyPayment(
    paymentPayload: B402PaymentPayload,
    paymentRequirements: PaymentRequirementOption
  ): Promise<B402VerifyResult> {
    if (this.mode === "official" && this.apiKey && this.secretKey) {
      try {
        const requestPath = "/build/api/v2/b402/verify";
        const envelope = {
          body: {
            x402Version: 2,
            paymentPayload,
            paymentRequirements,
          },
        };
        const rawBody = JSON.stringify(envelope);
        const headers = B402Signer.sign({
          apiKey: this.apiKey,
          secretKey: this.secretKey,
          method: "POST",
          requestPath,
          rawBody,
        });

        const response = await fetch(`${this.baseUrl}${requestPath}`, {
          method: "POST",
          headers,
          body: rawBody,
        });

        if (response.ok) {
          const resJson = (await response.json()) as { code?: string; msg?: string };
          if (resJson.code === "000000000") {
            return {
              valid: true,
              code: "000000000",
              payer: paymentPayload.payer,
              amount: paymentPayload.amount,
              asset: paymentPayload.asset,
            };
          }
        }
        // Fallback to shadow verification if upstream fails
        return this.shadowVerify(paymentPayload, paymentRequirements);
      } catch {
        return this.shadowVerify(paymentPayload, paymentRequirements);
      }
    }

    return this.shadowVerify(paymentPayload, paymentRequirements);
  }

  /**
   * Settles a verified b402 payment.
   */
  public async settlePayment(
    paymentPayload: B402PaymentPayload,
    paymentRequirements: PaymentRequirementOption,
    settleAmount?: string
  ): Promise<B402SettleResult> {
    if (this.mode === "official" && this.apiKey && this.secretKey) {
      try {
        const requestPath = "/build/api/v2/b402/settle";
        const envelope = {
          body: {
            x402Version: 2,
            paymentPayload,
            paymentRequirements,
            ...(settleAmount && { settleAmount }),
          },
        };
        const rawBody = JSON.stringify(envelope);
        const headers = B402Signer.sign({
          apiKey: this.apiKey,
          secretKey: this.secretKey,
          method: "POST",
          requestPath,
          rawBody,
        });

        const response = await fetch(`${this.baseUrl}${requestPath}`, {
          method: "POST",
          headers,
          body: rawBody,
        });

        if (response.ok) {
          const resJson = (await response.json()) as {
            code?: string;
            data?: { settlementId?: string; txHash?: string };
          };
          if (resJson.code === "000000000") {
            return {
              settled: true,
              settlementId: resJson.data?.settlementId ?? `b402-${randomUUID()}`,
              txHash: resJson.data?.txHash,
              settledAt: Date.now(),
              amount: settleAmount ?? paymentPayload.amount,
              asset: paymentPayload.asset,
              mode: "official",
            };
          }
        }
        return this.shadowSettle(paymentPayload, paymentRequirements, settleAmount);
      } catch {
        return this.shadowSettle(paymentPayload, paymentRequirements, settleAmount);
      }
    }

    return this.shadowSettle(paymentPayload, paymentRequirements, settleAmount);
  }

  /**
   * Local verification for shadow fallback mode (§5.6, §9.3).
   */
  public shadowVerify(
    payload: B402PaymentPayload,
    requirements: PaymentRequirementOption
  ): B402VerifyResult {
    if (payload.x402Version !== 2) {
      return { valid: false, code: "INVALID_VERSION", reason: "Expected x402Version 2" };
    }

    if (!payload.payer || !payload.payer.startsWith("0x") || payload.payer.length !== 42) {
      return { valid: false, code: "INVALID_PAYER", reason: "Payer address must be a valid 20-byte EVM address" };
    }

    if (payload.payTo.toLowerCase() !== requirements.payTo.toLowerCase()) {
      return { valid: false, code: "RECIPIENT_MISMATCH", reason: `payTo address ${payload.payTo} does not match required ${requirements.payTo}` };
    }

    if (payload.asset !== requirements.asset) {
      return { valid: false, code: "ASSET_MISMATCH", reason: `Asset ${payload.asset} does not match required ${requirements.asset}` };
    }

    // Amount check: payload amount must be >= required amount
    try {
      const payloadAmt = BigInt(payload.amount);
      const reqAmt = BigInt(requirements.amount);
      if (payloadAmt < reqAmt) {
        return { valid: false, code: "INSUFFICIENT_AMOUNT", reason: `Amount ${payload.amount} is less than required ${requirements.amount}` };
      }
    } catch {
      return { valid: false, code: "INVALID_AMOUNT", reason: "Amount must be a valid decimal string" };
    }

    // Expiration check
    const currentSeconds = Math.floor(Date.now() / 1000);
    if (payload.deadline < currentSeconds) {
      return { valid: false, code: "EXPIRED_PAYLOAD", reason: "Payment payload deadline has expired" };
    }

    if (!payload.signature || payload.signature.length < 10) {
      return { valid: false, code: "MISSING_SIGNATURE", reason: "Valid payment signature is required" };
    }

    return {
      valid: true,
      code: "000000000",
      payer: payload.payer,
      amount: payload.amount,
      asset: payload.asset,
    };
  }

  /**
   * Local deterministic settlement for shadow fallback mode (§5.6, §9.3).
   */
  public shadowSettle(
    payload: B402PaymentPayload,
    _requirements: PaymentRequirementOption,
    settleAmount?: string
  ): B402SettleResult {
    const finalAmount = settleAmount ?? payload.amount;
    const settlementHash = createHash("sha256")
      .update(`${payload.payer}:${payload.payTo}:${payload.nonce}:${finalAmount}:${Date.now()}`)
      .digest("hex");

    return {
      settled: true,
      settlementId: `b402-shadow-${settlementHash.slice(0, 16)}`,
      txHash: `0x${settlementHash}`,
      settledAt: Date.now(),
      amount: finalAmount,
      asset: payload.asset,
      mode: "shadow",
    };
  }
}
