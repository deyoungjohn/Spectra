// BNB Agent Studio Integration (§9.1)
// Implements ERC-8004 Agent Identity & ERC-8183 Inter-Agent Task Interface

import { createHash, randomUUID } from "node:crypto";
import type { Erc8004Identity, Erc8183Task, Erc8183TaskStatus } from "./types.js";

export class BnbAgentStudioClient {
  private readonly identities = new Map<string, Erc8004Identity>();
  private readonly tasks = new Map<string, Erc8183Task>();

  constructor() {
    // Register the default Spectra Autonomous Alpha Agent
    this.registerAgent({
      agentId: "spectra-alpha-agent-01",
      name: "Spectra Autonomous Alpha Agent",
      version: "1.0.0",
      description: "Empirically-grounded tokenized equity intelligence & arbitrage agent on BSC",
      ownerAddress: "0x1111111111111111111111111111111111111111",
      agentAddress: "0x2222222222222222222222222222222222222222",
      metadataUri: "https://spectra.finance/metadata/agent/spectra-alpha-agent-01.json",
      capabilities: [
        "MARKET_INTELLIGENCE",
        "FLOW_RADAR",
        "STRATEGY_EXECUTION",
        "B402_MONETIZATION",
        "AGENTIC_WALLET_EXECUTION",
      ],
      policyConstraints: {
        maxTradeNotionalUsd: "10000000000000000000000", // $10,000 in 18-dec
        maxSlippageBps: 50,
        killSwitchActive: false,
      },
    });
  }

  /**
   * Registers an agent with ERC-8004 compliant on-chain identity metadata.
   */
  public registerAgent(
    config: Omit<Erc8004Identity, "registeredAt" | "signature">
  ): Erc8004Identity {
    const registeredAt = Math.floor(Date.now() / 1000);
    const manifest = `${config.agentId}:${config.ownerAddress}:${config.agentAddress}:${config.metadataUri}:${registeredAt}`;
    const signature = `0x${createHash("sha256").update(manifest).digest("hex")}`;

    const identity: Erc8004Identity = {
      ...config,
      registeredAt,
      signature,
    };

    this.identities.set(identity.agentId, identity);
    return identity;
  }

  /**
   * Retrieves registered ERC-8004 agent identity.
   */
  public getAgent(agentId: string): Erc8004Identity | undefined {
    return this.identities.get(agentId);
  }

  /**
   * Lists all registered agents in this Agent Studio instance.
   */
  public listAgents(): Erc8004Identity[] {
    return Array.from(this.identities.values());
  }

  /**
   * Verifies an agent's ERC-8004 registration signature.
   */
  public verifyAgentIdentity(agentId: string): boolean {
    const agent = this.identities.get(agentId);
    if (!agent || !agent.signature) return false;

    const manifest = `${agent.agentId}:${agent.ownerAddress}:${agent.agentAddress}:${agent.metadataUri}:${agent.registeredAt}`;
    const expectedSig = `0x${createHash("sha256").update(manifest).digest("hex")}`;
    return agent.signature === expectedSig;
  }

  /**
   * Creates an ERC-8183 compliant task for inter-agent execution.
   */
  public createTask<TInput = Record<string, unknown>, TOutput = Record<string, unknown>>(
    creator: string,
    executor: string,
    taskType: string,
    inputPayload: TInput
  ): Erc8183Task<TInput, TOutput> {
    const taskId = `task-erc8183-${randomUUID()}`;
    const now = Date.now();
    const task: Erc8183Task<TInput, TOutput> = {
      taskId,
      creator,
      executor,
      taskType,
      inputPayload,
      status: "CREATED",
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(taskId, task as unknown as Erc8183Task);
    return task;
  }

  /**
   * Retrieves an ERC-8183 task by its ID.
   */
  public getTask(taskId: string): Erc8183Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Executes an ERC-8183 task through an executor callback.
   */
  public async executeTask<TInput = Record<string, unknown>, TOutput = Record<string, unknown>>(
    taskId: string,
    executorFn: (input: TInput) => Promise<TOutput>
  ): Promise<Erc8183Task<TInput, TOutput>> {
    const task = this.tasks.get(taskId) as unknown as Erc8183Task<TInput, TOutput> | undefined;
    if (!task) {
      throw new Error(`ERC-8183 Task not found: ${taskId}`);
    }

    task.status = "IN_PROGRESS";
    task.updatedAt = Date.now();

    try {
      const output = await executorFn(task.inputPayload);
      task.status = "COMPLETED";
      task.outputPayload = output;
      task.updatedAt = Date.now();
      return task;
    } catch (err) {
      task.status = "FAILED";
      task.error = err instanceof Error ? err.message : String(err);
      task.updatedAt = Date.now();
      return task;
    }
  }

  /**
   * Updates status of an existing task.
   */
  public updateTaskStatus(taskId: string, status: Erc8183TaskStatus, error?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    task.status = status;
    if (error) task.error = error;
    task.updatedAt = Date.now();
  }
}
