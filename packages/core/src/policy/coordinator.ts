// packages/core/src/policy/coordinator.ts
//
// Strategy Conflict Resolution Coordinator:
// Prevents multiple concurrent strategies from executing contradictory orders
// or breaching portfolio/sector/event caps.
// Reference: Spectra.md §5.9

import type { PolicyReasonCode } from "../types/policy.js";

export type StrategyPriority =
  | "KILL_SWITCH"
  | "HALT_GUARD"
  | "SCHEDULED_DCA"
  | "TACTICAL_RULE";

export interface StrategyProposal {
  id: string;
  strategyType: StrategyPriority;
  ticker: string;
  action: "BUY" | "SELL";
  requestedAmountUsd: bigint; // 18-dec fixed point
  sector?: string;
}

export interface CoordinatorDecision {
  proposalId: string;
  ticker: string;
  action: "BUY" | "SELL";
  status: "ACCEPTED" | "REJECTED" | "CLIPPED";
  requestedAmountUsd: bigint;
  executedAmountUsd: bigint;
  reasonCode: PolicyReasonCode | null;
  explanation: string;
}

export interface PortfolioSnapshot {
  cashUsd: bigint; // 18-dec fixed point
  holdings: Record<string, bigint>; // ticker -> amountUsd (18-dec)
  sectorHoldings?: Record<string, bigint>; // sector -> amountUsd (18-dec)
}

export interface CoordinatorConstraints {
  killSwitch?: boolean;
  activeHaltTickers?: Set<string>;
  tickerCaps?: Record<string, bigint>; // Max allowable holding per ticker
  sectorCaps?: Record<string, bigint>; // Max allowable holding per sector
}

export interface CoordinationResult {
  decisions: CoordinatorDecision[];
  finalCashUsd: bigint;
  finalHoldings: Record<string, bigint>;
}

export class StrategyCoordinator {
  /**
   * Sort priority according to Spectra.md §5.9:
   * Kill switch (0) > Halt signals / Guards (1) > Scheduled DCA (2) > Tactical rules (3)
   */
  private getPriorityScore(type: StrategyPriority): number {
    switch (type) {
      case "KILL_SWITCH":
        return 0;
      case "HALT_GUARD":
        return 1;
      case "SCHEDULED_DCA":
        return 2;
      case "TACTICAL_RULE":
        return 3;
    }
  }

  /**
   * Coordinate multiple proposals against portfolio constraints and priority rules.
   */
  coordinate(
    proposals: StrategyProposal[],
    portfolio: PortfolioSnapshot,
    constraints?: CoordinatorConstraints,
  ): CoordinationResult {
    // 1. Lock portfolio state
    let cash = portfolio.cashUsd;
    const holdings = { ...portfolio.holdings };
    const sectorHoldings = { ...(portfolio.sectorHoldings ?? {}) };

    const activeHalts = constraints?.activeHaltTickers ?? new Set<string>();
    const tickerCaps = constraints?.tickerCaps ?? {};
    const sectorCaps = constraints?.sectorCaps ?? {};
    const killSwitch = constraints?.killSwitch ?? false;

    // 2. Sort proposals by priority
    const sorted = [...proposals].sort(
      (a, b) => this.getPriorityScore(a.strategyType) - this.getPriorityScore(b.strategyType),
    );

    const decisions: CoordinatorDecision[] = [];

    // 3. Process proposals in priority order
    for (const prop of sorted) {
      const ticker = prop.ticker.toUpperCase();
      const currentHolding = holdings[ticker] ?? 0n;

      // Check global kill switch
      if (killSwitch) {
        decisions.push({
          proposalId: prop.id,
          ticker,
          action: prop.action,
          status: "REJECTED",
          requestedAmountUsd: prop.requestedAmountUsd,
          executedAmountUsd: 0n,
          reasonCode: "KILL_SWITCH",
          explanation: "Kill switch is active. All strategies rejected.",
        });
        continue;
      }

      // Check active halt or guard on this ticker
      if (activeHalts.has(ticker) && prop.strategyType !== "HALT_GUARD") {
        decisions.push({
          proposalId: prop.id,
          ticker,
          action: prop.action,
          status: "REJECTED",
          requestedAmountUsd: prop.requestedAmountUsd,
          executedAmountUsd: 0n,
          reasonCode: "HALT_SIGNAL_ACTIVE",
          explanation: `Halt signal is active for ${ticker}. Accumulation blocked.`,
        });
        continue;
      }

      if (prop.action === "SELL") {
        // Execute sell order (e.g. Divergence Guard reducing position)
        const sellAmount =
          prop.requestedAmountUsd > currentHolding ? currentHolding : prop.requestedAmountUsd;

        holdings[ticker] = currentHolding - sellAmount;
        cash += sellAmount;

        if (prop.sector && sectorHoldings[prop.sector]) {
          sectorHoldings[prop.sector] = (sectorHoldings[prop.sector] ?? 0n) - sellAmount;
        }

        const status = sellAmount === prop.requestedAmountUsd ? "ACCEPTED" : "CLIPPED";
        decisions.push({
          proposalId: prop.id,
          ticker,
          action: "SELL",
          status,
          requestedAmountUsd: prop.requestedAmountUsd,
          executedAmountUsd: sellAmount,
          reasonCode: null,
          explanation: `Accepted sell of ${sellAmount.toString()} USD.`,
        });
      } else {
        // BUY Proposal
        // Check ticker cap
        const tickerCap = tickerCaps[ticker];
        let maxBuyAllowedByTickerCap = prop.requestedAmountUsd;
        if (tickerCap !== undefined) {
          if (currentHolding >= tickerCap) {
            decisions.push({
              proposalId: prop.id,
              ticker,
              action: "BUY",
              status: "REJECTED",
              requestedAmountUsd: prop.requestedAmountUsd,
              executedAmountUsd: 0n,
              reasonCode: "POLICY_LIMIT",
              explanation: `Position in ${ticker} already at or above cap of ${tickerCap.toString()}.`,
            });
            continue;
          }
          const headroom = tickerCap - currentHolding;
          if (maxBuyAllowedByTickerCap > headroom) {
            maxBuyAllowedByTickerCap = headroom;
          }
        }

        // Check sector cap
        let maxBuyAllowedBySectorCap = maxBuyAllowedByTickerCap;
        if (prop.sector && sectorCaps[prop.sector] !== undefined) {
          const currentSectorHolding = sectorHoldings[prop.sector] ?? 0n;
          const sectorCap = sectorCaps[prop.sector]!;
          if (currentSectorHolding >= sectorCap) {
            decisions.push({
              proposalId: prop.id,
              ticker,
              action: "BUY",
              status: "REJECTED",
              requestedAmountUsd: prop.requestedAmountUsd,
              executedAmountUsd: 0n,
              reasonCode: "POLICY_LIMIT",
              explanation: `Sector ${prop.sector} already at or above cap of ${sectorCap.toString()}.`,
            });
            continue;
          }
          const sectorHeadroom = sectorCap - currentSectorHolding;
          if (maxBuyAllowedBySectorCap > sectorHeadroom) {
            maxBuyAllowedBySectorCap = sectorHeadroom;
          }
        }

        // Check cash headroom
        let finalBuyAmount = maxBuyAllowedBySectorCap;
        if (finalBuyAmount > cash) {
          finalBuyAmount = cash;
        }

        if (finalBuyAmount === 0n) {
          decisions.push({
            proposalId: prop.id,
            ticker,
            action: "BUY",
            status: "REJECTED",
            requestedAmountUsd: prop.requestedAmountUsd,
            executedAmountUsd: 0n,
            reasonCode: "INSUFFICIENT_CASH",
            explanation: "Insufficient cash available to execute buy proposal.",
          });
          continue;
        }

        // Execute buy
        holdings[ticker] = currentHolding + finalBuyAmount;
        cash -= finalBuyAmount;
        if (prop.sector) {
          sectorHoldings[prop.sector] = (sectorHoldings[prop.sector] ?? 0n) + finalBuyAmount;
        }

        const isClipped = finalBuyAmount < prop.requestedAmountUsd;
        decisions.push({
          proposalId: prop.id,
          ticker,
          action: "BUY",
          status: isClipped ? "CLIPPED" : "ACCEPTED",
          requestedAmountUsd: prop.requestedAmountUsd,
          executedAmountUsd: finalBuyAmount,
          reasonCode: isClipped ? "POLICY_LIMIT" : null,
          explanation: isClipped
            ? `Buy clipped from ${prop.requestedAmountUsd.toString()} to ${finalBuyAmount.toString()} due to caps/cash.`
            : `Accepted buy of ${finalBuyAmount.toString()} USD.`,
        });
      }
    }

    return {
      decisions,
      finalCashUsd: cash,
      finalHoldings: holdings,
    };
  }
}
