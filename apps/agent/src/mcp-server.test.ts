// apps/agent/src/mcp-server.test.ts
import { describe, it, expect } from "vitest";
import { SpectraMcpServer, SPECTRA_TOOLS } from "./mcp-server.js";

describe("Spectra MCP Server (§9.4)", () => {
  it("exposes the 5 specified tools with JSON schemas", () => {
    expect(SPECTRA_TOOLS.length).toBe(5);
    const names = SPECTRA_TOOLS.map((t) => t.name);
    expect(names).toContain("Spectra_get_signals");
    expect(names).toContain("Spectra_get_oracle_divergence");
    expect(names).toContain("Spectra_get_weekend_premium");
    expect(names).toContain("Spectra_execute_strategy");
    expect(names).toContain("Spectra_check_policy");
  });

  it("Spectra_get_signals executes and returns signal payload", async () => {
    const server = new SpectraMcpServer();
    const res = await server.handleToolCall("Spectra_get_signals", {});

    expect(res.isError).toBeUndefined();
    expect(res.content.length).toBe(1);
    const parsed = JSON.parse(res.content[0]!.text);
    expect(parsed.count).toBeDefined();
    expect(Array.isArray(parsed.signals)).toBe(true);
  });

  it("Spectra_get_oracle_divergence computes divergence and recommendation", async () => {
    const server = new SpectraMcpServer();
    const res = await server.handleToolCall("Spectra_get_oracle_divergence", { ticker: "AAPL" });

    expect(res.isError).toBeUndefined();
    const parsed = JSON.parse(res.content[0]!.text);
    expect(parsed.ticker).toBe("AAPL");
    expect(parsed.divergenceBps).toBeDefined();
    expect(parsed.divergenceState).toBeDefined();
    expect(parsed.recommendation).toBeDefined();
  });

  it("Spectra_get_weekend_premium returns feature locked note", async () => {
    const server = new SpectraMcpServer();
    const res = await server.handleToolCall("Spectra_get_weekend_premium", { ticker: "AAPL" });

    expect(res.isError).toBeUndefined();
    const parsed = JSON.parse(res.content[0]!.text);
    expect(parsed.ticker).toBe("AAPL");
    expect(parsed.active).toBe(false);
    expect(parsed.featureFlagLocked).toBe(true);
  });

  it("Spectra_check_policy returns compliance evaluation against constraints", async () => {
    const server = new SpectraMcpServer();
    const res = await server.handleToolCall("Spectra_check_policy", {
      action: {
        ticker: "AAPL",
        amountUsd: "500",
        expectedSlippageBps: 20,
      },
    });

    expect(res.isError).toBeUndefined();
    const parsed = JSON.parse(res.content[0]!.text);
    expect(parsed.allowed).toBe(true);
    expect(parsed.limits.maxTradeNotionalUsd).toBeDefined();
  });

  it("Spectra_execute_strategy executes swap when within policy", async () => {
    const server = new SpectraMcpServer();
    const res = await server.handleToolCall("Spectra_execute_strategy", {
      action: {
        ticker: "AAPL",
        amount: "250",
        fromAsset: "USDC",
      },
    });

    expect(res.isError).toBeUndefined();
    const parsed = JSON.parse(res.content[0]!.text);
    expect(parsed.status).toBe("SUCCESS");
    expect(parsed.txHash).toMatch(/^0x/);
  });

  it("Spectra_execute_strategy blocks swap when exceeding policy limits", async () => {
    const server = new SpectraMcpServer();
    const res = await server.handleToolCall("Spectra_execute_strategy", {
      action: {
        ticker: "AAPL",
        amount: "50000", // $50,000 exceeds $10,000 ceiling
        fromAsset: "USDC",
      },
    });

    expect(res.isError).toBe(true);
    const parsed = JSON.parse(res.content[0]!.text);
    expect(parsed.status).toBe("BLOCKED_BY_POLICY");
    expect(parsed.message).toContain("exceeds max notional limit");
  });

  it("returns error on unknown tool call", async () => {
    const server = new SpectraMcpServer();
    const res = await server.handleToolCall("unknown_tool", {});

    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("Unknown MCP tool");
  });
});
