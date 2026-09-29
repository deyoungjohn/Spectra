# Spectra — Project Handoff & Knowledge Base for Opencode

> **Target Audience:** Opencode / Incoming AI pair programmer / Core Developer  
> **Repository:** `deyoungjohn/Spectra`  
> **Last Verified:** 2026-09-29 • 214/214 Tests Passing • Zero Lint/Type Errors

---

## 1. Executive Summary & Core Premise

Spectra is a production-grade, modular intelligence terminal and autonomous execution layer for **tokenized equities (Real World Assets / RWA)** on **BNB Smart Chain (BSC)**.

### The Empirical Discovery (§1, §2)
The entire terminal is founded on the empirical discovery that on-chain equity protocols (e.g., Ondo Finance, bStocks, xStocks) often publish a `referencePrice` via RWA APIs that is **not an independent TradFi oracle**, but rather a **deterministic per-share unit conversion**:
$$\text{Per-Share Price} = \frac{\text{Token Price}}{\text{tokenToShareRatio}}$$

Because tokenized stocks trade 24/7 on DEXes while underlying TradFi US markets close at 16:00 EST and on weekends, deterministic unit conversion reveals:
1. **Oracle Divergence:** Deviation between on-chain DEX per-share price and true TradFi reference price (Finnhub / Yahoo Finance).
2. **Weekend Premium:** Asymmetric risk premium priced into on-chain equities during market closure.
3. **Cross-Platform Basis:** Arbitrage spreads between different tokenized stock issuers (e.g., Ondo vs bStocks vs xStocks).
4. **Smart Money & Whale Flow:** 24/7 accumulation and distribution tracking on BSC.

---

## 2. Monorepo Architecture & Package Map

The repository is organized as a Turborepo monorepo with npm workspaces:

```
Spectra/
├── packages/
│   ├── core/           # Mathematical, policy, normalization, flow, and agent logic
│   ├── contracts/      # Solidity 0.8.28 contracts (Hardhat, OpenZeppelin v5.2, Cancun EVM)
│   └── ui/             # React 19 UI component library (Tailwind v4, Framer Motion, beUI)
├── apps/
│   ├── web/            # Next.js 15/16 App Router frontend (Turbopack, port 3000)
│   ├── backend/        # Express 5 + WebSocket server (port 3001)
│   └── agent/          # Model Context Protocol (MCP) server for AI agents
├── docs/               # Specifications, decisions, DX reports, and verification audits
└── scripts/
    └── check.sh        # The single authoritative verification gate
```

### Key Package Breakdown:

#### 1. `@spectra/core` (`packages/core`)
- **`normalize/fixed-point.ts`**: Strict 18-decimal fixed-point arithmetic (`parseToFixed18`, `formatFixed18`, `fixedMul`, `fixedDiv`, `bpsDiff`, `applyBps`). **Zero floating-point math allowed for financial values.**
- **`services/data-ingestion.ts`**: Integrates `MockRwaDataProvider` & `BinanceRwaDataProvider` with automated TTL caching and stale-data fallbacks (§5.10).
- **`services/tradfi.ts`**: Independent TradFi price feeds (`FinnhubClient` primary + `YFinanceClient` fallback + `CompositeTradFiClient`).
- **`normalize/engine.ts`**: `NormalizationEngine` computing per-share conversions, ratio drift events, and basis calculations.
- **`signals/engine.ts`**: `SignalEngine` evaluating Signals A–F:
  - Signal A: `ORACLE_DIVERGENCE` (>10 bps alert, >25 bps critical halt)
  - Signal B: `WEEKEND_PREMIUM` (gated by feature flag)
  - Signal C: `CROSS_PLATFORM_BASIS` (>20 bps)
  - Signal D: `FLOW_ACCUMULATION` / `FLOW_DISTRIBUTION`
  - Signal E: `LIQUIDITY_IMBALANCE`
  - Signal F: `RATIO_DRIFT`
- **`policy/engine.ts` & `coordinator.ts`**: Multi-layer safety (`PolicyEngine`, `StrategyCoordinator`) enforcing kill switch, daily spend caps, slippage limits, and portfolio allocation caps.
- **`flow/`**: Flow Radar aggregator, BSC transfer parser, top-wallet rankings, pre-event positioning detector.
- **`strategy/`**: Strategy Forge compiler (`NLStrategyCompiler`), DSL validator (`StrategyValidator`), and dry-run simulator (`StrategySimulator` generating deterministic SHA-256 `simulationHash`).
- **`b402/` & `agent/`**: b402 Shadow Gateway payment facilitator, BNB Agent Studio (ERC-8004 / ERC-8183 lifecycle), Binance Web3 Agentic Wallet skills.

#### 2. `@spectra/contracts` (`packages/contracts`)
Solidity 0.8.28 contracts deployed to **BSC Mainnet (Chain 56)** and **BSC Testnet (Chain 97)**:
- **`OracleWatch.sol`**: On-chain divergence snapshots with automated bounded pruning (>1000 items) to prevent gas explosion.
- **`PolicyVault.sol`**: Programmatic trade risk caps, 24h usage resets, slippage checks, and owner kill switch.
- **`ReceiptRegistry.sol`**: Immutable on-chain anchoring of decision hashes and simulation hashes.
- **`ExecutionPlanVerifier.sol`**: EIP-712 cryptographic signature verification ensuring agent orders are approved by backend signer.
- **`MockFacilitator.sol`**: Cancun EVM payment settlement facilitator for b402 shadow gateway.
- **`FixedPointMath.sol`**: Inlined library for 18-decimal fixed-point calculations on-chain.

#### 3. `@spectra/ui` (`packages/ui`)
Modern React components built with Tailwind CSS v4, Framer Motion, and beUI motion primitives:
- `MarketStatusBanner`: Live market hours countdown, feed staleness badge.
- `SectorTabs`: Spring sliding pill selector (`MAG7`, `AI_CHIPS`, `ETFS`, `BUFFETT`).
- `AnomalyFilters`: Animated filter chips for market anomalies.
- `HeatmapView`: 3D `TiltCard` with cursor-tracked glare and signal color bars.
- `ScreenerTable`: Glassmorphic real-time data table with bps spreads and action buttons.
- `TickerDetailView` & `PlatformComparison`: High-density stock overview with side-by-side venue quotes.
- `FlowDashboard`: Smart money net flow overview cards and accumulation leaderboards.
- `WhaleTable`: Large transaction ledger with direction badges and BscScan links.
- `TickerFlowChart`: Bar visualizer with pre-event positioning alert pills.
- `CrossPlatformFlow`: Multi-venue migration breakdown (Ondo vs bStocks vs xStocks).
- `UnifiedLoopNav`: 4-stage stepper (`SEE → READ → FORGE → PROVE`).
- `TickerTape`: Bottom sticky bar with live `Marquee` signal stream and network metrics.

#### 4. `@spectra/web` (`apps/web`)
Next.js 15/16 App Router application:
- `/` — Market Intelligence dashboard (Heatmap & Screener Table view modes)
- `/flow` — Flow Radar (Smart money net flow & whale tracking)
- `/forge` — Strategy Forge (Natural language prompt compiler, templates, simulator)
- `/loop` — Unified Loop (Interactive walkthrough of the full end-to-end lifecycle)
- `/market/ticker/[ticker]` & `/flow/ticker/[ticker]` — Deep dive detail routes

#### 5. `@spectra/backend` (`apps/backend`)
Express 5 application on port `3001`:
- `/api/core/*` — Tokens, signals, policy checks, receipts
- `/api/market/*` — Heatmap, screener, ticker comparisons, sectors, anomalies
- `/api/flow/*` — Flow summaries, whale alerts, charts
- `/api/forge/*` — Strategy compilation and simulation
- `/api/alpha/*` — Paid b402 monetization endpoints ($0.01 - $0.03 USDC per call)
- WebSocket server (`SpectraWebSocketManager`) — Real-time signal broadcasts & market heartbeat
- Telegram Bot (`SpectraTelegramBot`) — grammY alert bot dispatcher

#### 6. `@spectra/agent` (`apps/agent`)
MCP server exposing 5 canonical tools for autonomous AI agents:
- `Spectra_get_signals`
- `Spectra_get_oracle_divergence`
- `Spectra_get_weekend_premium`
- `Spectra_execute_strategy`
- `Spectra_check_policy`

---

## 3. Live On-Chain Deployments & Configuration

All contracts are deployed and verified on BscScan.

### Owner / Deployer Address:
`0xC1012a56A20A7481718092a7f65cEA1fd2ebE4E7`

### Contract Addresses (BSC Mainnet 56 & Testnet 97):
| Contract | Address | Verification Status |
|---|---|---|
| `OracleWatch` | `0x2Ae7E670022957079357997a2D434911679e9c9a` | ✅ Verified on BscScan |
| `PolicyVault` | `0x4B218726007858FC77fb2Aa476bd547d13f14670` | ✅ Verified on BscScan |
| `ReceiptRegistry` | `0xCcFC9454797e03573680719cD7B13f2Ec0E8f66e` | ✅ Verified on BscScan |
| `ExecutionPlanVerifier` | `0x6BD55b647029b7F74A4DD66e0983E31279F818aD` | ✅ Verified on BscScan |
| `MockFacilitator` | `0xe8322243e30Eb8e6c79735f56314F3F26878b2cD` | ✅ Verified on BscScan |
| `FixedPointMath` | `0x9859a8dEcE7EA13A8c5004658805e0264a7e9c60` | Inlined inside `OracleWatch` |

---

## 4. Strict Engineering Invariants & Rules

When modifying or adding code to this repository, you **MUST** uphold these non-negotiable rules:

1. **Strict 18-Decimal Fixed-Point Math:**
   - **NEVER** use `Number()`, `parseFloat()`, or JavaScript floating-point math for financial values (prices, balances, spreads, fees).
   - Use the fixed-point functions in `@spectra/core/normalize/fixed-point.ts`: `parseToFixed18("224.50")`, `formatFixed18(bn)`, `fixedMul(a, b)`, `fixedDiv(a, b)`, `bpsDiff(a, b)`.
   - The repository's ESLint configuration strictly enforces `no-restricted-globals` for `Number`, `parseFloat`, `parseInt` on financial math.

2. **All 214 Tests Must Pass:**
   - Always run `./scripts/check.sh` before declaring completion.
   - Evidence from `./scripts/check.sh` is required by `AGENTS.md`.

3. **Etherscan / BscScan API V2 Standard:**
   - BscScan uses Etherscan API V2 (`https://api.etherscan.io/v2/api?chainid=56` or `chainid=97`).

4. **SSR Hydration Safety:**
   - In Next.js client components rendering date/time strings (`toLocaleTimeString()`), always use a `mounted` state check or `suppressHydrationWarning` to prevent SSR vs client locale mismatches.

5. **Design System & Styling:**
   - Uses Tailwind CSS v4, Inter font for UI, JetBrains Mono for data/numbers.
   - Dark theme base: `#0D0E12`, Elevated card: `#16181D`, Brand voltage: `#F0B90B` (BNB Gold).

---

## 5. Essential Commands & Verification

| Action | Command |
|---|---|
| **Run Full Verification** | `./scripts/check.sh` |
| **Run Tests (Core)** | `npm test -w @spectra/core` |
| **Run Tests (UI)** | `npm test -w @spectra/ui` |
| **Run Tests (Backend)** | `npm test -w @spectra/backend` |
| **Run Tests (Contracts)** | `npm test -w @spectra/contracts` |
| **Build Web Application** | `npm run build -w @spectra/web` |
| **Start Dev Web App** | `npm run dev -w @spectra/web` (port 3000) |
| **Start Dev Backend** | `npm run dev -w @spectra/backend` (port 3001) |

---

## 6. Current State of the UI Overhaul

The UI modernization (following `DESIGN.md` and beUI motion primitives) is actively deployed across the following files:
- `apps/web/src/app/layout.tsx`: Sticky glassmorphic header, glowing ambient wash, responsive navigation.
- `apps/web/src/app/globals.css`: Tailwind v4 theme tokens, marquee keyframes, glassmorphism utility classes.
- `packages/ui/src/lib/ease.ts` & `utils.ts`: Canonical beUI spring physics and class merge helper.
- `packages/ui/src/components/motion/`: `TiltCard`, `Marquee`, `NumberTicker`.
- `packages/ui/src/MarketStatusBanner.tsx`, `SectorTabs.tsx`, `AnomalyFilters.tsx`, `HeatmapView.tsx`, `ScreenerTable.tsx`, `TickerDetailView.tsx`, `PlatformComparison.tsx`.
- `packages/ui/src/FlowDashboard.tsx`, `WhaleTable.tsx`, `TickerFlowChart.tsx`, `CrossPlatformFlow.tsx`.
- `apps/web/src/app/page.tsx` & `apps/web/src/app/flow/page.tsx`.

### Potential Next Steps for Incoming Agent:
1. **Strategy Forge UI Modernization (`/forge`):**
   - Modernize `packages/ui/src/TemplateGallery.tsx` with selectable `TiltCard` components.
   - Modernize `packages/ui/src/NLInput.tsx` (natural language prompt composer).
   - Modernize `packages/ui/src/StrategyPreview.tsx` (syntax-highlighted DSL viewer).
   - Modernize `packages/ui/src/Simulator.tsx` (dry-run output card) and `ExecutionLog.tsx`.
   - Update `apps/web/src/app/forge/page.tsx` layout.
2. **Unified Loop UI Modernization (`/loop`):**
   - Polish `UnifiedLoopNav.tsx` stepper indicators and stage transition cards in `apps/web/src/app/loop/page.tsx`.
3. **Visual Quality Assurance:**
   - Use Playwright MCP tools to capture full-page snapshots on localhost:3000 and verify contrast, alignment, and hover effects per `~/.gemini/skills/ui-iteration.md`.
