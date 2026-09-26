// apps/agent/src/mcp-server.ts
//
// Spectra MCP Server (Spectra.md §9.4)
// Exposes 5 autonomous alpha & execution tools for Cursor / Claude Code / Agent Studio:
// 1. Spectra_get_signals
// 2. Spectra_get_oracle_divergence
// 3. Spectra_get_weekend_premium
// 4. Spectra_execute_strategy
// 5. Spectra_check_policy

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  SignalEngine,
  PolicyEngine,
  AgenticWalletClient,
  BnbAgentStudioClient,
  parseToFixed18,
  formatFixed18,
  BPS_PRECISION,
  type ExecutionPolicy,
} from "@spectra/core";

export interface McpServerConfig {
  signalEngine?: SignalEngine;
  policyEngine?: PolicyEngine;
  walletClient?: AgenticWalletClient;
  studioClient?: BnbAgentStudioClient;
}

export const SPECTRA_TOOLS = [
  {
    name: "Spectra_get_signals",
    description: "Get all active Spectra signals (divergence, basis, ratio drift, flow)",
    inputSchema: {
      type: "object",
      properties: {
        ticker: { type: "string", description: "Optional ticker filter (e.g. AAPL, TSLA)" },
      },
    },
  },
  {
    name: "Spectra_get_oracle_divergence",
    description: "Get oracle divergence vs TradFi for a ticker",
    inputSchema: {
      type: "object",
      properties: {
        ticker: { type: "string", description: "Stock ticker symbol (e.g. AAPL)" },
      },
      required: ["ticker"],
    },
  },
  {
    name: "Spectra_get_weekend_premium",
    description: "Get weekend sentiment premium for a ticker",
    inputSchema: {
      type: "object",
      properties: {
        ticker: { type: "string", description: "Stock ticker symbol (e.g. AAPL)" },
      },
      required: ["ticker"],
    },
  },
  {
    name: "Spectra_execute_strategy",
    description: "Execute a strategy action via Agentic Wallet",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "object",
          properties: {
            ticker: { type: "string" },
            amount: { type: "string" },
            direction: { type: "string", enum: ["BUY", "SELL"] },
            fromAsset: { type: "string" },
            recipient: { type: "string" },
            slippageBps: { type: "number" },
          },
          required: ["ticker", "amount"],
        },
      },
      required: ["action"],
    },
  },
  {
    name: "Spectra_check_policy",
    description: "Check if an action passes PolicyVault constraints",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "object",
          properties: {
            ticker: { type: "string" },
            amountUsd: { type: "string" },
            expectedSlippageBps: { type: "number" },
            recipient: { type: "string" },
          },
          required: ["ticker", "amountUsd"],
        },
      },
      required: ["action"],
    },
  },
];

export class SpectraMcpServer {
  private readonly server: Server;
  private readonly signalEngine: SignalEngine;
  private readonly policyEngine: PolicyEngine;
  private readonly walletClient: AgenticWalletClient;
  private readonly studioClient: BnbAgentStudioClient;

  constructor(config: McpServerConfig = {}) {
    this.signalEngine = config.signalEngine ?? new SignalEngine();
    this.policyEngine = config.policyEngine ?? new PolicyEngine(this.signalEngine);
    this.walletClient = config.walletClient ?? new AgenticWalletClient(this.policyEngine);
    this.studioClient = config.studioClient ?? new BnbAgentStudioClient();

    this.server = new Server(
      {
        name: "spectra-agent-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  public getServer(): Server {
    return this.server;
  }

  public getStudioClient(): BnbAgentStudioClient {
    return this.studioClient;
  }

  public getWalletClient(): AgenticWalletClient {
    return this.walletClient;
  }

  private setupHandlers(): void {
    // List available tools (§9.4)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: SPECTRA_TOOLS,
      };
    });

    // Execute tool (§9.4)
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return this.handleToolCall(name, (args ?? {}) as Record<string, unknown>);
    });
  }

  /**
   * Dispatches and executes an MCP tool call.
   */
  public async handleToolCall(
    name: string,
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
    try {
      switch (name) {
        case "Spectra_get_signals": {
          const rawTicker = args.ticker as string | undefined;
          const signals = this.signalEngine.getActiveSignals();
          const filtered = rawTicker
            ? signals.filter((s) => s.ticker.toUpperCase() === rawTicker.toUpperCase())
            : signals;

          const json = JSON.stringify(
            {
              count: filtered.length,
              signals: filtered.map((s) => ({
                id: s.id,
                type: s.type,
                ticker: s.ticker,
                severity: s.severity,
                value: s.value.toString(),
                actionable: s.actionable,
                regime: s.regime,
                context: s.context,
                timestamp: s.timestamp instanceof Date ? s.timestamp.toISOString() : String(s.timestamp),
              })),
            },
            null,
            2
          );

          return { content: [{ type: "text", text: json }] };
        }

        case "Spectra_get_oracle_divergence": {
          const ticker = ((args.ticker as string) ?? "AAPL").toUpperCase();
          // Simulated reference prices for demonstration and agent queries
          const onChainPrice18 = ticker === "TSLA" ? parseToFixed18("251.80") : parseToFixed18("221.40");
          const tradFiPrice18 = ticker === "TSLA" ? parseToFixed18("250.00") : parseToFixed18("220.00");

          const diff = onChainPrice18 - tradFiPrice18;
          const divergenceBps = (diff * BPS_PRECISION) / tradFiPrice18;
          const absBps = divergenceBps < 0n ? -divergenceBps : divergenceBps;

          const divergenceState =
            absBps > 50n ? "CRITICAL" : absBps > 20n ? "MODERATE" : "NORMAL";

          const json = JSON.stringify(
            {
              ticker,
              onChainPrice: formatFixed18(onChainPrice18),
              tradFiPrice: formatFixed18(tradFiPrice18),
              divergenceBps: divergenceBps.toString(),
              divergenceState,
              recommendation:
                divergenceBps > 30n
                  ? "SELL_ON_CHAIN_PREMIUM"
                  : divergenceBps < -30n
                    ? "BUY_ON_CHAIN_DISCOUNT"
                    : "HOLD",
              timestamp: Date.now(),
            },
            null,
            2
          );

          return { content: [{ type: "text", text: json }] };
        }

        case "Spectra_get_weekend_premium": {
          const ticker = ((args.ticker as string) ?? "AAPL").toUpperCase();
          const json = JSON.stringify(
            {
              ticker,
              premiumBps: "0",
              active: false,
              featureFlagLocked: true,
              note: "SIGNAL_WEEKEND_PREMIUM is locked to false per empirical finding in Spectra.md §5.8",
              timestamp: Date.now(),
            },
            null,
            2
          );

          return { content: [{ type: "text", text: json }] };
        }

        case "Spectra_execute_strategy": {
          const action = (args.action as Record<string, unknown>) ?? {};
          const ticker = ((action.ticker as string) ?? "AAPL").toUpperCase();
          const amount = (action.amount as string) ?? "100";
          const fromAsset = ((action.fromAsset as string) ?? "USDC").toUpperCase();
          const recipient = (action.recipient as string) ?? "0x2222222222222222222222222222222222222222";
          const slippageBps = typeof action.slippageBps === "number" ? action.slippageBps : 30;

          // First evaluate policy
          const amountIn18 = parseToFixed18(amount);
          const policyCheck = this.policyEngine.checkTrade(
            {
              userId: recipient,
              maxTradeNotionalUsd: parseToFixed18("10000"),
              dailyLimitUsd: parseToFixed18("50000"),
              maxSlippageBps: 50n,
              cooldownSeconds: 5,
              allowedTokens: [],
              killSwitch: false,
            },
            {
              ticker,
              tokenAddress: recipient,
              direction: "BUY",
              amountUsd: amountIn18,
              expectedSlippageBps: BigInt(slippageBps),
            }
          );

          if (!policyCheck.allowed) {
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    status: "BLOCKED_BY_POLICY",
                    reasonCode: policyCheck.reasonCode,
                    message: policyCheck.message,
                  }),
                },
              ],
            };
          }

          // Execute swap via Agentic Wallet
          const swapResult = await this.walletClient.swap({
            fromAsset,
            toAsset: ticker,
            amountIn: amount,
            minAmountOut: "0",
            recipient,
            slippageBps,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(swapResult, null, 2),
              },
            ],
          };
        }

        case "Spectra_check_policy": {
          const action = (args.action as Record<string, unknown>) ?? {};
          const ticker = ((action.ticker as string) ?? "AAPL").toUpperCase();
          const amountUsd = (action.amountUsd as string) ?? "100";
          const slippageBps = typeof action.expectedSlippageBps === "number" ? action.expectedSlippageBps : 20;
          const recipient = (action.recipient as string) ?? "0x2222222222222222222222222222222222222222";

          const policy: ExecutionPolicy = {
            userId: recipient,
            maxTradeNotionalUsd: parseToFixed18("10000"),
            dailyLimitUsd: parseToFixed18("50000"),
            maxSlippageBps: 50n,
            cooldownSeconds: 5,
            allowedTokens: [],
            killSwitch: false,
          };

          const check = this.policyEngine.checkTrade(
            policy,
            {
              ticker,
              tokenAddress: recipient,
              direction: "BUY",
              amountUsd: parseToFixed18(amountUsd),
              expectedSlippageBps: BigInt(slippageBps),
            }
          );

          const json = JSON.stringify(
            {
              allowed: check.allowed,
              reasonCode: check.reasonCode,
              message: check.message,
              limits: {
                maxTradeNotionalUsd: formatFixed18(policy.maxTradeNotionalUsd),
                dailyLimitUsd: formatFixed18(policy.dailyLimitUsd),
                maxSlippageBps: policy.maxSlippageBps.toString(),
                killSwitch: policy.killSwitch,
              },
            },
            null,
            2
          );

          return { content: [{ type: "text", text: json }] };
        }

        default:
          return {
            isError: true,
            content: [{ type: "text", text: `Unknown MCP tool: ${name}` }],
          };
      }
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: err instanceof Error ? err.message : String(err),
          },
        ],
      };
    }
  }

  /**
   * Connects the MCP server to standard I/O for Cursor or Claude Code integration.
   */
  public async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
