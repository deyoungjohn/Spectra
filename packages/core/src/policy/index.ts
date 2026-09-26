// packages/core/src/policy/index.ts
//
// Barrel export for policy engine and conflict resolution coordinator.

export type { TradeProposal, UserPolicyState } from "./engine.js";
export { PolicyEngine } from "./engine.js";

export type {
  StrategyPriority,
  StrategyProposal,
  CoordinatorDecision,
  PortfolioSnapshot,
  CoordinatorConstraints,
  CoordinationResult,
} from "./coordinator.js";
export { StrategyCoordinator } from "./coordinator.js";
