// b402 V2 HMAC-SHA256 Signer (§5.6)
//
// Rules from Spectra.md §5.6:
// - HMAC-SHA256 signing: timestamp + method + requestPath + rawBody
// - Headers: X-OC-APIKEY, X-OC-TIMESTAMP (ISO-8601), X-OC-SIGN (Base64)
// - Outer envelope: Sign and send {"body": ...}, not only inner x402 object

import { createHmac } from "node:crypto";

export interface B402SignOptions {
  apiKey: string;
  secretKey: string;
  method?: "GET" | "POST";
  requestPath: string;
  rawBody: string;
  timestamp?: string; // ISO-8601 string; if omitted, current ISO timestamp is generated
}

export interface B402SignatureHeaders extends Record<string, string> {
  "X-OC-APIKEY": string;
  "X-OC-TIMESTAMP": string;
  "X-OC-SIGN": string;
  "Content-Type": string;
}

export class B402Signer {
  /**
   * Generates HMAC-SHA256 signature and returns the required b402 headers.
   */
  public static sign(options: B402SignOptions): B402SignatureHeaders {
    const { apiKey, secretKey, requestPath, rawBody } = options;
    const method = options.method ?? "POST";
    const timestamp = options.timestamp ?? new Date().toISOString();

    const signPayload = `${timestamp}${method}${requestPath}${rawBody}`;
    const hmac = createHmac("sha256", secretKey);
    hmac.update(signPayload);
    const signature = hmac.digest("base64");

    return {
      "X-OC-APIKEY": apiKey,
      "X-OC-TIMESTAMP": timestamp,
      "X-OC-SIGN": signature,
      "Content-Type": "application/json",
    };
  }

  /**
   * Verifies an incoming b402 HMAC-SHA256 signature.
   */
  public static verify(
    headers: { apiKey?: string; timestamp?: string; signature?: string },
    method: string,
    requestPath: string,
    rawBody: string,
    secretKey: string
  ): boolean {
    if (!headers.apiKey || !headers.timestamp || !headers.signature) {
      return false;
    }

    const expectedPayload = `${headers.timestamp}${method}${requestPath}${rawBody}`;
    const hmac = createHmac("sha256", secretKey);
    hmac.update(expectedPayload);
    const expectedSignature = hmac.digest("base64");

    return headers.signature === expectedSignature;
  }
}
