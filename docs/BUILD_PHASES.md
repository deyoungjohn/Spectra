# Spectra Build Phases

> Single source of truth for build progress. Every phase, step, bug fix, test,
> decision, pivot, and lesson is logged here.

Last updated: 2026-09-26

---

## Phase Overview

| Phase | Name | Scope | Status |
|-------|------|-------|--------|
| 0 | Project Scaffolding | Monorepo, toolchain, CI, config | ✅ Complete |
| 1 | Base Layer — Core Data | Fixed-point math, types, normalization engine, data ingestion | ✅ Complete |
| 2 | Base Layer — Signals & Policy | Signal engine, policy engine, config & feature flags | ✅ Complete |
| 3 | Smart Contracts | FixedPointMath, OracleWatch, PolicyVault, ReceiptRegistry, ExecutionPlan | ✅ Complete |
| 4 | Module 1 — Market Intelligence | Heatmap, screener, anomaly filters, API endpoints, UI | 🔄 In Progress |
| 5 | Module 3 — Flow Radar | BscScan integration, flow aggregation, UI | ⬜ Not Started |
| 6 | Module 2 — Strategy Forge | NL input, templates, simulator, strategy DSL, deployment | ⬜ Not Started |
| 7 | Agent Layer | BNB Agent Studio, Agentic Wallet, MCP server, b402 payment gateway | ⬜ Not Started |
| 8 | Integration & Polish | Cross-module wiring, conflict resolution, notifications, UX polish | ⬜ Not Started |
| 9 | Deployment & Verification | Vercel deploy, contract deployment, pre-mainnet checklist, demo video | ⬜ Not Started |

---

## Phase 0: Project Scaffolding

**Goal:** Establish the monorepo structure, toolchain, linting, testing
framework, and CI so all subsequent phases build on a solid foundation.

### Steps

- [x] **0.1** Initialize Turborepo monorepo with `apps/web`, `apps/backend`,
  `apps/agent`, `packages/core`, `packages/contracts`, `packages/ui`
- [x] **0.2** Configure TypeScript (`tsconfig.json` base + per-package)
- [x] **0.3** Configure ESLint with financial math lint rules from Spectra.md
  §5.2.2
- [x] **0.4** Configure Vitest for `packages/core` and `apps/backend`
- [x] **0.5** Set up Next.js App Router in `apps/web` with Tailwind CSS +
  shadcn/ui — *placeholder created, full setup deferred to Phase 4*
- [x] **0.6** Set up Express skeleton in `apps/backend` — *placeholder created,
  full setup deferred to Phase 1*
- [x] **0.7** Update `scripts/check.sh` to run monorepo lint, typecheck, test,
  build
- [x] **0.8** Create `packages/core/src/config/features.ts` with all feature
  flags from Spectra.md §5.8
- [x] **0.9** Create environment variable schema (`.env.example`)
- [x] **0.10** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- ✅ Monorepo builds with zero errors
- ✅ Lint rules block floating-point financial math
- ✅ Test runner executes (36 tests passing)
- ✅ Feature flags are importable from `@spectra/core`

### Log

| Date | Step | Notes |
|------|------|-------|
| 2026-09-26 | 0.1–0.10 | Full scaffolding complete. Turborepo + npm workspaces, TypeScript strict mode, Vitest with 36 tests, ESLint with financial math rules. ADR-0002 created. |

---

## Phase 1: Base Layer — Core Data

**Goal:** Implement the mathematical and data foundations that every module
depends on: fixed-point arithmetic, normalized stock types, data ingestion
service.

### Steps

- [x] **1.1** Implement `packages/core/src/normalize/fixed-point.ts` — all 6
  functions from Spectra.md §5.2.1
- [x] **1.2** Write exhaustive tests for fixed-point math (edge cases: zero,
  negative, overflow, precision loss)
- [x] **1.3** Define `NormalizedStock` interface and `AlphaSignal` interface in
  `packages/core/src/types/`
- [x] **1.4** Define `Platform`, `MarketStatus`, and other shared enums
- [x] **1.5** Implement `DataIngestionService` — RWA Data API client with
  polling + caching
- [x] **1.6** Implement `NormalizationEngine` — per-share conversion using live
  `tokenToShareRatio`
- [x] **1.7** Implement external TradFi client (Finnhub primary, yfinance
  fallback)
- [x] **1.8** Implement Redis cache layer (Upstash-compatible in-memory fallback)
- [x] **1.9** Write integration tests with mocked API responses
- [x] **1.10** Verify: `./scripts/check.sh` passes, all tests green

### Acceptance Criteria
- ✅ Fixed-point math matches Spectra.md §5.2.1 exactly
- ✅ `NormalizedStock` can be constructed from raw API data
- ✅ Data ingestion handles rate limiting and caching
- ✅ External TradFi fallback works when primary is down

### Log

| Date | Step | Notes |
|------|------|-------|
| 2026-09-26 | 1.1–1.10 | Implemented `MemoryCacheService`, `FinnhubClient`, `YFinanceClient`, `CompositeTradFiClient`, `MockRwaDataProvider`, `BinanceRwaDataProvider`, `DataIngestionService`, and `NormalizationEngine`. Built Express backend app in `apps/backend`. 70 tests passing (65 core + 5 backend API), zero lint errors. |

---

## Phase 2: Base Layer — Signals & Policy

**Goal:** Implement the signal engine (6 signal types), policy engine, and
receipt service.

### Steps

- [x] **2.1** Implement Signal Engine — all 6 signal types from Spectra.md §5.3
- [x] **2.2** Implement regime awareness (OPEN vs CLOSED signal gating)
- [x] **2.3** Implement `SIGNAL_WEEKEND_PREMIUM` feature flag gate
- [x] **2.4** Implement Policy Engine with `ExecutionPolicy` interface
- [x] **2.5** Implement Receipt Service (decision hashing, SHA-256)
- [x] **2.6** Implement Strategy Conflict Resolution coordinator (§5.9)
- [x] **2.7** Implement missing-data-as-product-state behavior (§5.10)
- [x] **2.8** Write unit tests for each signal type
- [x] **2.9** Write tests for conflict resolution with worked example
- [x] **2.10** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- ✅ All 6 signal types fire correctly with test data
- ✅ Weekend Premium signal is gated by feature flag (OFF by default)
- ✅ Policy engine rejects trades that violate constraints
- ✅ Conflict resolution matches the worked example in §5.9

### Log

| Date | Step | Notes |
|------|------|-------|
| 2026-09-26 | 2.1–2.10 | Implemented `SignalEngine` (Signals A-F with OPEN/CLOSED regimes and Weekend Premium flag gate), `PolicyEngine` (kill switch, active halt, limits, cooldown, whitelist), `ReceiptService` (SHA-256 decision/simulation/quote hashing), and `StrategyCoordinator` with priority-netting conflict resolution. 94 total tests passing across 10 test suites (85 core + 9 backend), zero lint errors. |

---

## Phase 3: Smart Contracts

**Goal:** Implement and test all Solidity contracts from Spectra.md §10.

### Steps

- [x] **3.1** Set up Hardhat in `packages/contracts`
- [x] **3.2** Implement `FixedPointMath.sol` (§10.7)
- [x] **3.3** Implement `OracleWatch.sol` with pruning (§10.2)
- [x] **3.4** Implement `PolicyVault.sol` (§10.3)
- [x] **3.5** Implement `ReceiptRegistry.sol` (§10.4)
- [x] **3.6** Implement `ExecutionPlanVerifier.sol` with EIP-712 (§10.8)
- [x] **3.7** Write Solidity tests for all contracts
- [x] **3.8** Test gas costs and bounded array behavior
- [x] **3.9** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- ✅ All contracts compile and pass tests (19 Solidity files compiled with Cancun EVM, 11 tests passing)
- ✅ Gas costs are reasonable for hackathon demo (bounded history pruning in OracleWatch, storage mapping patterns)
- ✅ EIP-712 verification works end-to-end in tests (tested with ethers signTypedData)

### Log

| Date | Step | Notes |
|------|------|-------|
| 2026-09-26 | 3.1–3.9 | Set up Hardhat with OpenZeppelin v5 and Cancun EVM. Implemented FixedPointMath.sol, OracleWatch.sol (bounded pruning), PolicyVault.sol (limits & kill switch), ReceiptRegistry.sol (decision hashing), and ExecutionPlanVerifier.sol (EIP-712). All 11 Hardhat tests passing, monorepo total reaches 105 passing tests across 11 test suites. |

---

## Phase 4: Module 1 — Market Intelligence

**Goal:** Build the "Finviz layer" — heatmap, screener, anomaly filters, and
ticker detail pages.

### Steps

- [x] **4.1** Implement `/api/market/*` backend routes (§6.4)
- [x] **4.2** Build `MarketStatusBanner` component (§6.3)
- [x] **4.3** Build `HeatmapView` with D3.js treemap (§6.3)
- [x] **4.4** Build `ScreenerTable` with filtering (§6.3)
- [x] **4.5** Build `AnomalyFilters` (Oracle Div, Weekend Premium, Basis,
  Ratio Drift)
- [x] **4.6** Build `SectorTabs` (Mag7, AI Chips, ETF, Buffett)
- [x] **4.7** Build ticker detail page (`/market/ticker/[ticker]`)
- [x] **4.8** Build `PlatformComparison` view
- [x] **4.9** Implement b402 paid endpoint: `GET /api/alpha/screener`
- [x] **4.10** Write component tests and API route tests
- [x] **4.11** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- ✅ Heatmap renders all tracked tickers with signal-based coloring
- ✅ Screener filters work for all Web3 anomaly types
- ✅ Market status banner shows open/closed with countdown
- ✅ Ticker detail shows normalized price comparison and active signals
- ✅ Production Next.js build and React component test suite passing

### Log

| Date | Step | Notes |
|------|------|-------|
| 2026-09-26 | 4.1–4.11 | Implemented Market Intelligence Layer. Express API (`/api/market/*` and paid `/api/alpha/screener`), shared UI library (`@spectra/ui` with `MarketStatusBanner`, `AnomalyFilters`, `SectorTabs`, `HeatmapView`, `ScreenerTable`, `PlatformComparison`, `TickerDetailView`), and Next.js 16 app (`apps/web` with responsive dark theme, sector filtering, and dynamic ticker route). 120 total tests passing across 12 test suites, Next.js build clean in 111ms. |

---

## Phase 5: Module 3 — Flow Radar

**Goal:** Build the "Quiver Quant layer" — wallet tracking, net flow charts,
whale alerts.

### Steps

- [x] **5.1** Implement BscScan API client for token transfer events
- [x] **5.2** Implement Flow Aggregator (group by ticker + platform, top-N
  wallets, net flow computation)
- [x] **5.3** Implement Flow Signal Engine (FLOW_ACCUMULATION,
  FLOW_DISTRIBUTION, WHALE_MOVEMENT)
- [x] **5.4** Implement `/api/flow/*` backend routes
- [x] **5.5** Build `FlowDashboard` UI
- [x] **5.6** Build `TickerFlowChart` (net flow time-series)
- [x] **5.7** Build `WhaleTable`
- [x] **5.8** Build `CrossPlatformFlow` view
- [x] **5.9** Implement b402 paid endpoint: `GET /api/alpha/flow/:ticker`
- [x] **5.10** Write tests
- [x] **5.11** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- ✅ Flow data populates from BscScan (or mock in dev)
- ✅ Net flow charts render per ticker
- ✅ Flow signals integrate with Base Layer Signal Engine
- ✅ Module gracefully degrades when `MODULE_3_FLOW_RADAR = false`
- ✅ Whale alerts, top wallet tracking, and pre-event positioning operational

### Log

| Date | Step | Notes |
|------|------|-------|
| 2026-09-26 | 5.1–5.11 | Built Quiver Quant flow layer. Implemented `HttpBscScanClient` / `MockBscScanProvider`, `FlowAggregator` (trailing 1h/4h/24h net flow, pre-event positioning, hourly time series, cross-platform flow), and `FlowSignalEngine` (accumulation, distribution, whale alerts). Added backend endpoints `/api/flow/*` and paid b402 endpoint `GET /api/alpha/flow/:ticker` ($0.02 USDC). Built UI components (`FlowDashboard`, `TickerFlowChart`, `WhaleTable`, `CrossPlatformFlow`) and Next.js routes (`/flow` and `/flow/ticker/[ticker]`). 150 tests passing across 15 test suites. |

---

## Phase 6: Module 2 — Strategy Forge

**Goal:** Build the "Composer layer" — NL strategy input, templates, simulator,
agent deployment.

### Steps

- [x] **6.1** Define Strategy DSL JSON schema (condition + action blocks from
  §7.2)
- [x] **6.2** Implement strategy validator and policy checker
- [x] **6.3** Implement NL → DSL compiler (LLM-based parsing)
- [x] **6.4** Implement 4 pre-built templates (§7.7)
- [x] **6.5** Implement Strategy Simulator (dry-run via Transaction API mock)
- [x] **6.6** Implement `/api/forge/*` backend routes
- [x] **6.7** Build `TemplateGallery` UI
- [x] **6.8** Build `NLInput` component
- [x] **6.9** Build `StrategyPreview` (compiled DSL view)
- [x] **6.10** Build `Simulator` results view
- [x] **6.11** Build `ExecutionLog` with receipt links
- [x] **6.12** Write tests
- [x] **6.13** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- ✅ NL input compiles to valid Strategy DSL
- ✅ All 4 templates are deployable (Weekly DCA, Basis Rotation, Oracle Guard, Weekend Fade)
- ✅ Simulator runs dry-run and shows results with SHA-256 simulationHash
- ✅ Strategies are bound to PolicyVault constraints

### Log

| Date | Step | Notes |
|------|------|-------|
| 2026-09-26 | 6.1–6.13 | Built Composer Strategy Forge layer. Implemented Strategy DSL types, 4 pre-built templates, `StrategyValidator` (action, trigger, policy bounds), `NLStrategyCompiler` (pattern & intent matching), and `StrategySimulator` (dry-run fee & slippage computation with SHA-256 simulationHash). Added `/api/forge/*` backend routes. Created `@spectra/ui` components (`TemplateGallery`, `NLInput`, `StrategyPreview`, `Simulator`, `ExecutionLog`) and Next.js `/forge` workspace. 173 tests passing across 16 test suites. |

---

## Phase 7: Agent Layer

**Goal:** Wire up BNB Agent Studio, Agentic Wallet, MCP server, and b402
payment gateway.

### Steps

- [x] **7.1** Implement b402 Payment Gateway with shadow fallback (§5.6)
- [x] **7.2** Implement b402 V2 HMAC signing
- [x] **7.3** Implement paid API endpoints with 402 responses
- [x] **7.4** Implement MCP server with 5 tools (§9.4)
- [x] **7.5** Integrate BNB Agent Studio (ERC-8004 identity)
- [x] **7.6** Integrate Agentic Wallet skills (get-quote, swap, get-balances,
  simulate-transaction)
- [x] **7.7** Implement Bazaar extension metadata (§5.6)
- [x] **7.8** Write integration tests
- [x] **7.9** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- ✅ b402 shadow gateway works end-to-end with MockFacilitator.sol contract
- ✅ MCP server responds to all 5 tool calls (signals, oracle divergence, weekend premium, execute strategy, check policy)
- ✅ Agent can execute trades via Agentic Wallet with strict PolicyVault enforcement
- ✅ 204 total passing tests across 21 test suites in the monorepo

### Log

| Date | Step | Notes |
|------|------|-------|
| 2026-09-26 | 7.1–7.9 | Implemented Agent Layer. Built `PaymentGateway` with official mode and shadow fallback, `B402Signer` (HMAC-SHA256), `BazaarMetadata` schemas, and `MockFacilitator.sol` contract on BSC Cancun EVM. Expanded backend with all 6 paid `/api/alpha/*` endpoints. Integrated `BnbAgentStudioClient` (ERC-8004 identity & ERC-8183 task runner), `AgenticWalletClient` (get-quote, swap, get-balances, simulate-transaction), and `SpectraMcpServer` exposing 5 tools. 204 tests passing across 21 test suites. |

---

## Phase 8: Integration & Polish

**Goal:** Wire all modules together, implement cross-cutting concerns, polish
the UX.

### Steps

- [ ] **8.1** Wire Signal Engine events to Notification Service
- [ ] **8.2** Implement WebSocket real-time updates
- [ ] **8.3** Implement Telegram Bot alerts (grammY)
- [ ] **8.4** Wire Flow Radar signals into Strategy Forge conditions
- [ ] **8.5** Implement the full Unified Loop (SEE → READ → FORGE → PROVE)
- [ ] **8.6** Implement design system (colors, typography, UI states from §11)
- [ ] **8.7** Implement dashboard layout (top nav, sidebar, bottom bar)
- [ ] **8.8** End-to-end testing of the full loop
- [ ] **8.9** Performance optimization (caching, lazy loading)
- [ ] **8.10** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- A user can complete the full Unified Loop from UI
- Alerts fire on Telegram and WebSocket
- Design matches Spectra.md §11 color palette and typography
- All modules coordinate via Base Layer (no direct API calls)

### Log

| Date | Step | Notes |
|------|------|-------|

---

## Phase 9: Deployment & Verification

**Goal:** Deploy to production, run pre-mainnet checks, record demo.

### Steps

- [ ] **9.1** Deploy frontend to Vercel
- [ ] **9.2** Deploy backend to Railway/Render
- [ ] **9.3** Deploy smart contracts to BSC Testnet
- [ ] **9.4** Set up Supabase (PostgreSQL) and Upstash (Redis)
- [ ] **9.5** Run Pre-Mainnet Verification Checklist (§22)
- [ ] **9.6** Record demo video showing the Unified Loop
- [ ] **9.7** Write DX Report (§20)
- [ ] **9.8** Final `./scripts/check.sh` pass
- [ ] **9.9** Tag release

### Acceptance Criteria
- Live application accessible at Vercel URL
- Contracts verified on BSCScan
- Demo video shows Intel → Strategy → Execution flow
- Pre-mainnet checklist items documented (pass/fail)

### Log

| Date | Step | Notes |
|------|------|-------|

---

## Pivots & Lessons Learned

Record any pivots from the original plan, and lessons learned from mistakes.

| Date | Phase | What Changed | Why | Impact |
|------|-------|-------------|-----|--------|
| | | | | |

---

## Bug Tracker

| ID | Date | Phase | Description | Root Cause | Fix | Resolved |
|----|------|-------|-------------|------------|-----|----------|
| | | | | | | |
