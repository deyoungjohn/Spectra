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
| 2 | Base Layer — Signals & Policy | Signal engine, policy engine, config & feature flags | 🔄 In Progress |
| 3 | Smart Contracts | FixedPointMath, OracleWatch, PolicyVault, ReceiptRegistry, ExecutionPlan | ⬜ Not Started |
| 4 | Module 1 — Market Intelligence | Heatmap, screener, anomaly filters, API endpoints, UI | ⬜ Not Started |
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

- [ ] **2.1** Implement Signal Engine — all 6 signal types from Spectra.md §5.3
- [ ] **2.2** Implement regime awareness (OPEN vs CLOSED signal gating)
- [ ] **2.3** Implement `SIGNAL_WEEKEND_PREMIUM` feature flag gate
- [ ] **2.4** Implement Policy Engine with `ExecutionPolicy` interface
- [ ] **2.5** Implement Receipt Service (decision hashing, SHA-256)
- [ ] **2.6** Implement Strategy Conflict Resolution coordinator (§5.9)
- [ ] **2.7** Implement missing-data-as-product-state behavior (§5.10)
- [ ] **2.8** Write unit tests for each signal type
- [ ] **2.9** Write tests for conflict resolution with worked example
- [ ] **2.10** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- All 6 signal types fire correctly with test data
- Weekend Premium signal is gated by feature flag (OFF by default)
- Policy engine rejects trades that violate constraints
- Conflict resolution matches the worked example in §5.9

### Log

| Date | Step | Notes |
|------|------|-------|

---

## Phase 3: Smart Contracts

**Goal:** Implement and test all Solidity contracts from Spectra.md §10.

### Steps

- [ ] **3.1** Set up Hardhat/Foundry in `packages/contracts`
- [ ] **3.2** Implement `FixedPointMath.sol` (§10.7)
- [ ] **3.3** Implement `OracleWatch.sol` with pruning (§10.2)
- [ ] **3.4** Implement `PolicyVault.sol` (§10.3)
- [ ] **3.5** Implement `ReceiptRegistry.sol` (§10.4)
- [ ] **3.6** Implement `ExecutionPlanVerifier.sol` with EIP-712 (§10.8)
- [ ] **3.7** Write Solidity tests for all contracts
- [ ] **3.8** Test gas costs and bounded array behavior
- [ ] **3.9** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- All contracts compile and pass tests
- Gas costs are reasonable for hackathon demo
- EIP-712 verification works end-to-end in tests

### Log

| Date | Step | Notes |
|------|------|-------|

---

## Phase 4: Module 1 — Market Intelligence

**Goal:** Build the "Finviz layer" — heatmap, screener, anomaly filters, and
ticker detail pages.

### Steps

- [ ] **4.1** Implement `/api/market/*` backend routes (§6.4)
- [ ] **4.2** Build `MarketStatusBanner` component (§6.3)
- [ ] **4.3** Build `HeatmapView` with D3.js treemap (§6.3)
- [ ] **4.4** Build `ScreenerTable` with filtering (§6.3)
- [ ] **4.5** Build `AnomalyFilters` (Oracle Div, Weekend Premium, Basis,
  Ratio Drift)
- [ ] **4.6** Build `SectorTabs` (Mag7, AI Chips, ETF, Buffett)
- [ ] **4.7** Build ticker detail page (`/market/ticker/[ticker]`)
- [ ] **4.8** Build `PlatformComparison` view
- [ ] **4.9** Implement b402 paid endpoint: `GET /api/alpha/screener`
- [ ] **4.10** Write component tests and API route tests
- [ ] **4.11** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- Heatmap renders all tracked tickers with signal-based coloring
- Screener filters work for all Web3 anomaly types
- Market status banner shows open/closed with countdown
- Ticker detail shows normalized price chart

### Log

| Date | Step | Notes |
|------|------|-------|

---

## Phase 5: Module 3 — Flow Radar

**Goal:** Build the "Quiver Quant layer" — wallet tracking, net flow charts,
whale alerts.

### Steps

- [ ] **5.1** Implement BscScan API client for token transfer events
- [ ] **5.2** Implement Flow Aggregator (group by ticker + platform, top-N
  wallets, net flow computation)
- [ ] **5.3** Implement Flow Signal Engine (FLOW_ACCUMULATION,
  FLOW_DISTRIBUTION, WHALE_MOVEMENT)
- [ ] **5.4** Implement `/api/flow/*` backend routes
- [ ] **5.5** Build `FlowDashboard` UI
- [ ] **5.6** Build `TickerFlowChart` (net flow time-series)
- [ ] **5.7** Build `WhaleTable`
- [ ] **5.8** Build `CrossPlatformFlow` view
- [ ] **5.9** Implement b402 paid endpoint: `GET /api/alpha/flow/:ticker`
- [ ] **5.10** Write tests
- [ ] **5.11** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- Flow data populates from BscScan (or mock in dev)
- Net flow charts render per ticker
- Flow signals integrate with Base Layer Signal Engine
- Module gracefully degrades when `MODULE_3_FLOW_RADAR = false`

### Log

| Date | Step | Notes |
|------|------|-------|

---

## Phase 6: Module 2 — Strategy Forge

**Goal:** Build the "Composer layer" — NL strategy input, templates, simulator,
agent deployment.

### Steps

- [ ] **6.1** Define Strategy DSL JSON schema (condition + action blocks from
  §7.2)
- [ ] **6.2** Implement strategy validator and policy checker
- [ ] **6.3** Implement NL → DSL compiler (LLM-based parsing)
- [ ] **6.4** Implement 4 pre-built templates (§7.7)
- [ ] **6.5** Implement Strategy Simulator (dry-run via Transaction API mock)
- [ ] **6.6** Implement `/api/forge/*` backend routes
- [ ] **6.7** Build `TemplateGallery` UI
- [ ] **6.8** Build `NLInput` component
- [ ] **6.9** Build `StrategyPreview` (compiled DSL view)
- [ ] **6.10** Build `Simulator` results view
- [ ] **6.11** Build `ExecutionLog` with receipt links
- [ ] **6.12** Write tests
- [ ] **6.13** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- NL input compiles to valid Strategy DSL
- All 4 templates are deployable
- Simulator runs dry-run and shows results
- Strategies are bound to PolicyVault constraints

### Log

| Date | Step | Notes |
|------|------|-------|

---

## Phase 7: Agent Layer

**Goal:** Wire up BNB Agent Studio, Agentic Wallet, MCP server, and b402
payment gateway.

### Steps

- [ ] **7.1** Implement b402 Payment Gateway with shadow fallback (§5.6)
- [ ] **7.2** Implement b402 V2 HMAC signing
- [ ] **7.3** Implement paid API endpoints with 402 responses
- [ ] **7.4** Implement MCP server with 5 tools (§9.4)
- [ ] **7.5** Integrate BNB Agent Studio (ERC-8004 identity)
- [ ] **7.6** Integrate Agentic Wallet skills (get-quote, swap, get-balances,
  simulate-transaction)
- [ ] **7.7** Implement Bazaar extension metadata (§5.6)
- [ ] **7.8** Write integration tests
- [ ] **7.9** Verify: `./scripts/check.sh` passes

### Acceptance Criteria
- b402 shadow gateway works end-to-end
- MCP server responds to all 5 tool calls
- Agent can execute trades via Agentic Wallet (testnet)

### Log

| Date | Step | Notes |
|------|------|-------|

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
