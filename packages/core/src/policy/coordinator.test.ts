// packages/core/src/policy/coordinator.test.ts
import { describe, it, expect } from "vitest";
import {
  StrategyCoordinator,
  type StrategyProposal,
  type PortfolioSnapshot,
} from "./coordinator.js";
import { parseToFixed18 } from "../normalize/fixed-point.js";

describe("StrategyCoordinator", () => {
  it("executes the exact worked conflict resolution example from Spectra.md §5.9", () => {
    // Portfolio: $1,000 total: $200 cash, $280 NVDA, $120 AMD
    const initialPortfolio: PortfolioSnapshot = {
      cashUsd: parseToFixed18("200"),
      holdings: {
        NVDA: parseToFixed18("280"),
        AMD: parseToFixed18("120"),
      },
      sectorHoldings: {
        SEMICONDUCTOR: parseToFixed18("400"), // $280 + $120 = $400
      },
    };

    // Constraints from §5.9:
    // Confirmed Oracle Divergence Guard caps NVDA at $250 (25% of $1,000)
    // Semiconductor sector cap is $400 (40% of $1,000)
    // Active halt/guard active on NVDA
    const constraints = {
      activeHaltTickers: new Set(["NVDA"]),
      tickerCaps: {
        NVDA: parseToFixed18("250"),
      },
      sectorCaps: {
        SEMICONDUCTOR: parseToFixed18("400"),
      },
    };

    // Three simultaneous proposals from §5.9:
    const proposals: StrategyProposal[] = [
      {
        id: "prop-1",
        strategyType: "SCHEDULED_DCA",
        ticker: "NVDA",
        action: "BUY",
        requestedAmountUsd: parseToFixed18("60"),
        sector: "SEMICONDUCTOR",
      },
      {
        id: "prop-2",
        strategyType: "HALT_GUARD",
        ticker: "NVDA",
        action: "SELL",
        requestedAmountUsd: parseToFixed18("30"), // Reduce $280 to $250
        sector: "SEMICONDUCTOR",
      },
      {
        id: "prop-3",
        strategyType: "TACTICAL_RULE",
        ticker: "AMD",
        action: "BUY",
        requestedAmountUsd: parseToFixed18("50"),
        sector: "SEMICONDUCTOR",
      },
    ];

    const coordinator = new StrategyCoordinator();
    const result = coordinator.coordinate(proposals, initialPortfolio, constraints);

    // 1. Verify Scheduled DCA was rejected while event cap is active
    const dcaDecision = result.decisions.find((d) => d.proposalId === "prop-1");
    expect(dcaDecision).toBeDefined();
    expect(dcaDecision?.status).toBe("REJECTED");
    expect(dcaDecision?.reasonCode).toBe("HALT_SIGNAL_ACTIVE");
    expect(dcaDecision?.executedAmountUsd).toBe(0n);

    // 2. Verify Divergence Guard sell was accepted ($30 sell)
    const guardDecision = result.decisions.find((d) => d.proposalId === "prop-2");
    expect(guardDecision).toBeDefined();
    expect(guardDecision?.status).toBe("ACCEPTED");
    expect(guardDecision?.executedAmountUsd).toBe(parseToFixed18("30"));

    // 3. Verify Tactical Rule AMD buy was clipped to $30 (to respect $400 sector cap)
    const tacticalDecision = result.decisions.find((d) => d.proposalId === "prop-3");
    expect(tacticalDecision).toBeDefined();
    expect(tacticalDecision?.status).toBe("CLIPPED");
    expect(tacticalDecision?.reasonCode).toBe("POLICY_LIMIT");
    expect(tacticalDecision?.executedAmountUsd).toBe(parseToFixed18("30"));

    // 4. Verify combined final portfolio state:
    // NVDA = $250, AMD = $150, cash = $200 (fees omitted)
    expect(result.finalHoldings["NVDA"]).toBe(parseToFixed18("250"));
    expect(result.finalHoldings["AMD"]).toBe(parseToFixed18("150"));
    expect(result.finalCashUsd).toBe(parseToFixed18("200"));
  });

  it("rejects all proposals when killSwitch is active", () => {
    const portfolio: PortfolioSnapshot = {
      cashUsd: parseToFixed18("1000"),
      holdings: {},
    };

    const proposals: StrategyProposal[] = [
      {
        id: "p1",
        strategyType: "TACTICAL_RULE",
        ticker: "AAPL",
        action: "BUY",
        requestedAmountUsd: parseToFixed18("50"),
      },
    ];

    const coordinator = new StrategyCoordinator();
    const result = coordinator.coordinate(proposals, portfolio, { killSwitch: true });

    expect(result.decisions[0]?.status).toBe("REJECTED");
    expect(result.decisions[0]?.reasonCode).toBe("KILL_SWITCH");
  });
});
