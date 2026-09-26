// packages/core/src/agent/agent.test.ts
import { describe, it, expect } from "vitest";
import {
  B402Signer,
  PaymentGateway,
  getBazaarMetadata,
  BnbAgentStudioClient,
  AgenticWalletClient,
  PolicyEngine,
  parseToFixed18,
  type ExecutionPolicy,
  type B402PaymentPayload,
  type PaymentRequirementOption,
} from "../index.js";

describe("Agent Layer (Phase 7)", () => {
  describe("b402 HMAC-SHA256 Signer (§5.6)", () => {
    it("generates and verifies HMAC-SHA256 signature headers", () => {
      const apiKey = "spectra-api-key-123";
      const secretKey = "super-secret-hmac-key";
      const requestPath = "/build/api/v2/b402/verify";
      const rawBody = JSON.stringify({ body: { test: true } });

      const headers = B402Signer.sign({
        apiKey,
        secretKey,
        method: "POST",
        requestPath,
        rawBody,
        timestamp: "2026-09-26T22:00:00.000Z",
      });

      expect(headers["X-OC-APIKEY"]).toBe(apiKey);
      expect(headers["X-OC-TIMESTAMP"]).toBe("2026-09-26T22:00:00.000Z");
      expect(headers["X-OC-SIGN"]).toBeDefined();
      expect(typeof headers["X-OC-SIGN"]).toBe("string");

      const isValid = B402Signer.verify(
        {
          apiKey: headers["X-OC-APIKEY"],
          timestamp: headers["X-OC-TIMESTAMP"],
          signature: headers["X-OC-SIGN"],
        },
        "POST",
        requestPath,
        rawBody,
        secretKey
      );

      expect(isValid).toBe(true);

      // Verify tampered body fails
      const isTamperedValid = B402Signer.verify(
        {
          apiKey: headers["X-OC-APIKEY"],
          timestamp: headers["X-OC-TIMESTAMP"],
          signature: headers["X-OC-SIGN"],
        },
        "POST",
        requestPath,
        rawBody + "tampered",
        secretKey
      );
      expect(isTamperedValid).toBe(false);
    });
  });

  describe("Bazaar Extension Metadata (§5.6)", () => {
    it("returns schema and route metadata for discoverability", () => {
      const oracleMeta = getBazaarMetadata("oracleDivergence");
      expect(oracleMeta).toBeDefined();
      expect(oracleMeta?.routeTemplate).toBe("/api/alpha/oracle-divergence/:ticker");
      expect(oracleMeta?.schema.properties).toBeDefined();

      const flowMeta = getBazaarMetadata("flow");
      expect(flowMeta).toBeDefined();
      expect(flowMeta?.info.input.method).toBe("GET");
    });
  });

  describe("PaymentGateway (Shadow mode & Verification) (§5.6)", () => {
    const gateway = new PaymentGateway({ mode: "shadow" });
    const reqOption: PaymentRequirementOption = {
      scheme: "exact",
      asset: "USDC",
      network: "bsc",
      amount: "10000",
      payTo: gateway.getPayTo(),
    };

    it("verifies and settles valid shadow payment payloads", async () => {
      const payload: B402PaymentPayload = {
        x402Version: 2,
        payer: "0x1111111111111111111111111111111111111111",
        payTo: gateway.getPayTo(),
        asset: "USDC",
        amount: "10000",
        network: "bsc",
        nonce: "nonce-999",
        deadline: Math.floor(Date.now() / 1000) + 1200,
        signature: "0xsig1234567890abcdef",
      };

      const verifyRes = await gateway.verifyPayment(payload, reqOption);
      expect(verifyRes.valid).toBe(true);
      expect(verifyRes.code).toBe("000000000");

      const settleRes = await gateway.settlePayment(payload, reqOption);
      expect(settleRes.settled).toBe(true);
      expect(settleRes.settlementId).toMatch(/^b402-shadow-/);
      expect(settleRes.mode).toBe("shadow");
    });

    it("rejects invalid payer, mismatched asset, or insufficient amount", () => {
      const badPayer: B402PaymentPayload = {
        x402Version: 2,
        payer: "invalid-address",
        payTo: gateway.getPayTo(),
        asset: "USDC",
        amount: "10000",
        network: "bsc",
        nonce: "nonce-1",
        deadline: Math.floor(Date.now() / 1000) + 600,
        signature: "0xsig",
      };
      expect(gateway.shadowVerify(badPayer, reqOption).valid).toBe(false);

      const badAsset: B402PaymentPayload = {
        ...badPayer,
        payer: "0x1111111111111111111111111111111111111111",
        asset: "USDT",
      };
      expect(gateway.shadowVerify(badAsset, reqOption).valid).toBe(false);

      const underpaid: B402PaymentPayload = {
        ...badPayer,
        payer: "0x1111111111111111111111111111111111111111",
        amount: "5000", // Required 10000
      };
      expect(gateway.shadowVerify(underpaid, reqOption).valid).toBe(false);
    });
  });

  describe("BNB Agent Studio Client (ERC-8004 & ERC-8183) (§9.1)", () => {
    it("registers agent identity with ERC-8004 signature and metadata", () => {
      const studio = new BnbAgentStudioClient();
      const defaultAgent = studio.getAgent("spectra-alpha-agent-01");

      expect(defaultAgent).toBeDefined();
      expect(defaultAgent?.name).toBe("Spectra Autonomous Alpha Agent");
      expect(defaultAgent?.signature).toBeDefined();
      expect(studio.verifyAgentIdentity("spectra-alpha-agent-01")).toBe(true);

      const customAgent = studio.registerAgent({
        agentId: "my-arbitrage-agent",
        name: "Arbitrage Agent",
        version: "1.0.0",
        description: "Executes basis trades across BSC DEXes",
        ownerAddress: "0x3333333333333333333333333333333333333333",
        agentAddress: "0x4444444444444444444444444444444444444444",
        metadataUri: "https://spectra.finance/metadata/my-arbitrage-agent.json",
        capabilities: ["STRATEGY_EXECUTION"],
        policyConstraints: {
          maxTradeNotionalUsd: "5000000000000000000000",
          maxSlippageBps: 40,
          killSwitchActive: false,
        },
      });

      expect(customAgent.agentId).toBe("my-arbitrage-agent");
      expect(studio.verifyAgentIdentity("my-arbitrage-agent")).toBe(true);
    });

    it("manages ERC-8183 inter-agent tasks through lifecycle", async () => {
      const studio = new BnbAgentStudioClient();
      const task = studio.createTask(
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222",
        "ANALYZE_DIVERGENCE",
        { ticker: "AAPL" }
      );

      expect(task.status).toBe("CREATED");

      const executedTask = await studio.executeTask(task.taskId, async (input) => {
        expect((input as { ticker: string }).ticker).toBe("AAPL");
        return { divergenceBps: "42", recommendation: "BUY_ON_CHAIN" };
      });

      expect(executedTask.status).toBe("COMPLETED");
      expect((executedTask.outputPayload as { divergenceBps: string }).divergenceBps).toBe("42");
    });
  });

  describe("Agentic Wallet Integration (§9.2)", () => {
    it("binance-web3/get-quote computes cross-DEX quote and minAmountOut", async () => {
      const wallet = new AgenticWalletClient();
      const quote = await wallet.getQuote({
        fromAsset: "USDC",
        toAsset: "AAPL",
        amountIn: "1000",
        slippageBps: 50,
      });

      expect(quote.quoteId).toBeDefined();
      expect(quote.route).toEqual(["USDC", "WBNB", "AAPL"]);
      expect(quote.dex).toBe("PancakeSwap_v3");
      expect(quote.amountOut).toBeDefined();
      expect(quote.minAmountOut).toBeDefined();
      expect(BigInt(parseToFixed18(quote.minAmountOut))).toBeLessThan(BigInt(parseToFixed18(quote.amountOut)));
    });

    it("binance-web3/swap executes swap within policy limits", async () => {
      const policyEngine = new PolicyEngine();
      const wallet = new AgenticWalletClient(policyEngine);

      const res = await wallet.swap({
        fromAsset: "USDC",
        toAsset: "AAPL",
        amountIn: "500",
        minAmountOut: "2.2",
        recipient: "0x2222222222222222222222222222222222222222",
      });

      expect(res.status).toBe("SUCCESS");
      expect(res.txHash).toMatch(/^0x/);
      expect(res.gasUsed).toBeDefined();
    });

    it("binance-web3/swap blocks trade violating PolicyVault ceiling", async () => {
      const policyEngine = new PolicyEngine();
      const restrictivePolicy: ExecutionPolicy = {
        userId: "test-user",
        maxTradeNotionalUsd: parseToFixed18("100"), // Only $100 ceiling
        dailyLimitUsd: parseToFixed18("500"),
        maxSlippageBps: 50n,
        cooldownSeconds: 5,
        allowedTokens: [],
        killSwitch: false,
      };

      const wallet = new AgenticWalletClient(policyEngine, restrictivePolicy);

      const res = await wallet.swap(
        {
          fromAsset: "USDC",
          toAsset: "AAPL",
          amountIn: "5000", // $5000 exceeds $100 ceiling!
          minAmountOut: "20",
          recipient: "0x2222222222222222222222222222222222222222",
        },
        restrictivePolicy
      );

      expect(res.status).toBe("BLOCKED_BY_POLICY");
      expect(res.revertReason).toContain("exceeds max notional limit");
    });

    it("binance-web3/get-balances returns wallet token holdings", async () => {
      const wallet = new AgenticWalletClient();
      const res = await wallet.getBalances("0x2222222222222222222222222222222222222222");

      expect(res.walletAddress).toBe("0x2222222222222222222222222222222222222222");
      expect(res.balances.USDC).toBeDefined();
      expect(res.balances.BNB).toBeDefined();
      expect(res.balances.BAAPL).toBeDefined();
    });

    it("binance-web3/simulate-transaction returns dry-run gas and logs", async () => {
      const wallet = new AgenticWalletClient();
      const sim = await wallet.simulateTransaction({
        from: "0x1111111111111111111111111111111111111111",
        to: "0x2222222222222222222222222222222222222222",
        data: "0x1234abcd",
      });

      expect(sim.success).toBe(true);
      expect(sim.gasEstimate).toBe("128450");
      expect(sim.logs.length).toBeGreaterThan(0);
    });
  });
});
