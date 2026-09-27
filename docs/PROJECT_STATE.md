# Project state

Last updated: 2026-09-27

## Objective

Spectra is a production-grade, modular terminal combining market screening,
on-chain flow analysis, and agentic strategy execution for tokenized equities
on BNB Smart Chain. Built on the empirical proof that the RWA Data API's
`referencePrice` is a deterministic per-share unit conversion, not an
independent TradFi oracle.

## Current status

- **Phase 0 (Project Scaffolding): ✅ Complete**
- **Phase 1 (Base Layer — Core Data): ✅ Complete**
- **Phase 2 (Base Layer — Signals & Policy): ✅ Complete**
- **Phase 3 (Smart Contracts): ✅ Complete**
- **Phase 4 (Module 1 — Market Intelligence): ✅ Complete**
- **Phase 5 (Module 3 — Flow Radar): ✅ Complete**
- **Phase 6 (Module 2 — Strategy Forge): ✅ Complete**
- **Phase 7 (Agent Layer): ✅ Complete**
- **Phase 8 (Integration & Polish): ✅ Complete**
- **Phase 9 (Deployment & Verification): ✅ Complete**
- **All 10 Build Phases Complete & Verified: Production-Ready**
- Live Deployed & Verified Contracts (BSC Mainnet 56 & BSC Testnet 97):
  - Deployer / Owner Address: `0xC1012a56A20A7481718092a7f65cEA1fd2ebE4E7`
  - `OracleWatch`: `0x2Ae7E670022957079357997a2D434911679e9c9a` (✅ Verified on BscScan)
  - `PolicyVault`: `0x4B218726007858FC77fb2Aa476bd547d13f14670` (✅ Verified on BscScan)
  - `ReceiptRegistry`: `0xCcFC9454797e03573680719cD7B13f2Ec0E8f66e` (✅ Verified on BscScan)
  - `ExecutionPlanVerifier`: `0x6BD55b647029b7F74A4DD66e0983E31279F818aD` (✅ Verified on BscScan)
  - `MockFacilitator`: `0xe8322243e30Eb8e6c79735f56314F3F26878b2cD` (✅ Verified on BscScan)
  - `FixedPointMath`: `0x9859a8dEcE7EA13A8c5004658805e0264a7e9c60` (Internal library, inlined and verified inside `OracleWatch`)
- Deployment & Verification Artifacts:
  - `apps/web/vercel.json`: Production Vercel App Router configuration with security headers
  - `Dockerfile`, `railway.json`, `render.yaml`: Multi-stage production container configurations
  - `packages/contracts/scripts/deploy.cjs`: Hardhat BSC Testnet & Mainnet deployment script for all 6 contracts
  - `packages/core/db/schema.sql`: Complete PostgreSQL / Supabase migration schema
  - `docs/PRE_MAINNET_VERIFICATION.md`: Empirical verification gates audit per Spectra.md §22
  - `docs/DEMO_WALKTHROUGH.md`: 5-act hackathon presentation and video recording script
  - `docs/DX_REPORT.md`: Comprehensive Developer Experience report for b402, Agent Studio, and Agentic Wallet per §20
  - `docs/DEPLOYMENT.md`: Step-by-step production deployment manual
  - `README.md`: Complete showcase documentation with architecture diagrams, contract addresses, and quickstart
- Integration & Polish Layer implements:
  - `NotificationService` in `@spectra/core/services/notification.ts`: central notification broker subscribed to `SignalEngine.onSignal`
  - `SpectraWebSocketManager` in `apps/backend/src/websocket.ts`: real-time client connection manager with initial snapshots, heartbeat ping/pong, and event broadcast
  - `SpectraTelegramBot` in `apps/backend/src/telegram.ts`: grammY bot dispatcher (`/start`, `/signals`, `/status`, `/alerts`) with mock fallback
  - Backend integration in `apps/backend/src/app.ts`: `/api/notifications` log and `/api/telegram/command` dispatch
  - UI additions in `@spectra/ui`: `UnifiedLoopNav` (4-stage stepper) and `TickerTape` (sticky status bar with market status pulse, WS indicator, and live signals)
  - Unified Loop in `apps/web/src/app/loop/page.tsx`: interactive walkthrough through the complete lifecycle `SEE → READ → FORGE → PROVE`
- Agent Layer (`apps/agent` & `@spectra/core/agent`, `@spectra/core/b402`) implements:
  - `PaymentGateway`: Official upstream b402 mode with automatic shadow fallback
  - `B402Signer`: HMAC-SHA256 envelope signing and verification (`X-OC-APIKEY`, `X-OC-TIMESTAMP`, `X-OC-SIGN`)
  - `BazaarMetadata`: Discovery schemas for all 6 paid alpha feeds
  - `MockFacilitator.sol`: Cancun EVM contract on BSC testnet/mainnet fork for shadow settlement verification
  - Paid Alpha Endpoints: `/api/alpha/{screener,flow,oracle-divergence,weekend-premium,basis,signals}` and `/api/alpha/b402/{verify,settle,supported}`
  - `BnbAgentStudioClient`: ERC-8004 identity registration and verification; ERC-8183 inter-agent task lifecycle
  - `AgenticWalletClient`: 4 Binance Web3 wallet skills (`binance-web3/get-quote`, `swap`, `get-balances`, `simulate-transaction`) with strict PolicyVault enforcement
  - `SpectraMcpServer`: Model Context Protocol server exposing the 5 canonical tools (`Spectra_get_signals`, `Spectra_get_oracle_divergence`, `Spectra_get_weekend_premium`, `Spectra_execute_strategy`, `Spectra_check_policy`)
- Strategy Forge (`@spectra/core/strategy`) implements:
  - 4 canonical pre-built templates: Weekly DCA, Basis Rotation, Oracle Guard, Weekend Fade
  - `StrategyValidator`: Syntactical validation & `ExecutionPolicy` bounds enforcement
  - `NLStrategyCompiler`: Natural language prompt compiler into composite `StrategyDSL`
  - `StrategySimulator`: Dry-run simulation with fee & slippage calculation and SHA-256 `simulationHash`
- Flow Radar (`@spectra/core/flow`) implements:
  - `BscScanProvider` / `HttpBscScanClient` with caching & fallback to `MockBscScanProvider`
  - `FlowAggregator`: Trailing 1h, 4h, 24h net flow, top-N wallet rankings, pre-event positioning detection, hourly time series, cross-platform aggregation
  - `FlowSignalEngine`: `FLOW_ACCUMULATION` (> $5,000 net 4h), `FLOW_DISTRIBUTION` (< -$5,000 net 4h), and `WHALE_MOVEMENT` (> $10,000 transaction)
- UI Library (`@spectra/ui`) implements:
  - `MarketStatusBanner`: Market hours status, countdown to open/close, staleness indicator
  - `AnomalyFilters`: Toggle filter chips for divergence, premium, basis, flow, and drift
  - `SectorTabs`: Magnificent 7, AI Chips, ETFs, Buffett Portfolio filters
  - `HeatmapView`: Responsive grid with per-share price conversion and signal-severity color grading
  - `ScreenerTable`: Real-time cross-platform scanner with bps spreads and volume
  - `PlatformComparison`: Side-by-side Ondo, bStocks, and xStocks price & ratio comparison
  - `TickerDetailView`: Deep inspection with price spread cards, active signals, and Strategy Forge trigger
  - `FlowDashboard`: Total 24h market net flow, top accumulation & distribution leaderboards, degradation banners
  - `TickerFlowChart`: Net flow time series with pre-event positioning alerts and hourly volume bars
  - `WhaleTable`: Large wallet tracking table with direction, notional USD, share amounts, and BSC tx links
  - `CrossPlatformFlow`: Side-by-side venue flow routing (Ondo vs bStocks vs xStocks) with dominant venue badge
  - `TemplateGallery`: One-click deployable strategy templates
  - `NLInput`: Natural language strategy prompt composer with preset chips
  - `StrategyPreview`: Formatted Strategy DSL viewer with valid/invalid badges and deploy buttons
  - `Simulator`: Dry-run execution output with SHA-256 hash and policy check badges
  - `ExecutionLog`: Audit trail of autonomous agent trades and execution receipts
- Next.js Web Application (`apps/web`):
  - Turbopack-enabled Next.js 16 dashboard with routes `/`, `/flow`, `/forge`, `/market/ticker/[ticker]`, and `/flow/ticker/[ticker]`
  - Spectra dark theme (`#0D0E12`, `#F0B90B` gold accent)
- Smart Contracts (`@spectra/contracts`) implements:
  - `FixedPointMath.sol`: 18-decimal fixed-point library on-chain
  - `OracleWatch.sol`: Divergence recording with bounded history pruning
  - `PolicyVault.sol`: On-chain execution policy storage and kill switch
  - `ReceiptRegistry.sol`: On-chain decision receipt anchoring with SHA-256 hashes
  - `ExecutionPlanVerifier.sol`: EIP-712 structured cryptographic plan verification
- Core package (`@spectra/core`) implements:
  - BigInt 18-decimal fixed-point arithmetic (6 functions)
  - Data Ingestion Service with RWA Data API and mock providers
  - Composite TradFi Client (Finnhub primary + Yahoo Finance fallback)
  - Normalization Engine (per-share conversion, ratio drift detection, basis)
  - Signal Engine (Signals A-F: Oracle Divergence, Weekend Premium, Basis, Flow, Liquidity, Ratio Drift)
  - Policy Engine (kill switch, halt signals, max notional, slippage caps, cooldowns, daily limits, whitelist)
  - Receipt Service (SHA-256 decision, simulation, and quote hashing)
  - Strategy Conflict Resolution Coordinator (priority netting, cap enforcement)
  - Memory Cache Service with TTL
- Backend API (`@spectra/backend`) running Express with `/api/health`, `/api/core/*`, `/api/market/*`, `/api/flow/*`, `/api/forge/*`, and b402 paid `/api/alpha/screener` and `/api/alpha/flow/:ticker`
- 214 total passing tests across 23 test suites (120 core + 28 ui + 44 backend + 8 agent + 14 smart contracts)
- Zero type errors, zero lint warnings, production Next.js build passes
- Build phases tracked in `docs/BUILD_PHASES.md`

## Architecture

- **Monorepo:** Turborepo with npm workspaces
- **Language:** TypeScript (strict mode, ES2022 target)
- **Math:** BigInt-only 18-decimal fixed-point (no floating-point financial math)
- **Packages:**
  - `packages/core` — Shared types, normalization engine math, config
  - `packages/contracts` — Solidity smart contracts (Phase 3)
  - `packages/ui` — Shared React components (Phase 4)
- **Apps:**
  - `apps/web` — Next.js Dashboard (Phase 4)
  - `apps/backend` — Express API + Base Layer services (Phase 1)
  - `apps/agent` — Agent runtime + MCP Server (Phase 7)
- **Test framework:** Vitest
- **Lint:** ESLint with financial math rules blocking `parseFloat` and `Number`

## Required verification

Run:

```bash
./scripts/check.sh
```

This runs:
1. Required file existence checks
2. Shell script syntax validation
3. JSON/TOML syntax validation
4. TypeScript typechecking across all workspaces
5. Vitest and Hardhat unit & integration tests (214 passing)
6. ESLint linting with financial math rules and Next.js production build

## Known limitations

- The local MCP memory package should not be written by multiple agent processes
  concurrently. Close one agent and its MCP process before opening the next.
- MCP memory is supplementary and does not replace tests, Git history, decision
  records, specifications, or the change ledger.
- Weekend Premium signal is LOCKED OFF (`SIGNAL_WEEKEND_PREMIUM=false`) until
  the weekend empirical test passes (Spectra.md §2.4).
