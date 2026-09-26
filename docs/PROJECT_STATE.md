# Project state

Last updated: 2026-09-26

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
- Phase 5 (Module 3 — Flow Radar): 🔄 Next up
- UI Library (`@spectra/ui`) implements:
  - `MarketStatusBanner`: Market hours status, countdown to open/close, staleness indicator
  - `AnomalyFilters`: Toggle filter chips for divergence, premium, basis, flow, and drift
  - `SectorTabs`: Magnificent 7, AI Chips, ETFs, Buffett Portfolio filters
  - `HeatmapView`: Responsive grid with per-share price conversion and signal-severity color grading
  - `ScreenerTable`: Real-time cross-platform scanner with bps spreads and volume
  - `PlatformComparison`: Side-by-side Ondo, bStocks, and xStocks price & ratio comparison
  - `TickerDetailView`: Deep inspection with price spread cards, active signals, and Strategy Forge trigger
- Next.js Web Application (`apps/web`):
  - Turbopack-enabled Next.js 16 dashboard with dynamic route `/market/ticker/[ticker]`
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
- Backend API (`@spectra/backend`) running Express with `/api/health`, `/api/core/*`, `/api/market/*`, and b402 paid `/api/alpha/screener`
- 120 total passing tests across 12 test suites (85 core + 8 ui + 16 backend + 11 smart contracts)
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
4. TypeScript typechecking for core, backend, and agent packages
5. Vitest unit tests for `@spectra/core`
6. ESLint linting with financial math rules

## Known limitations

- The local MCP memory package should not be written by multiple agent processes
  concurrently. Close one agent and its MCP process before opening the next.
- MCP memory is supplementary and does not replace tests, Git history, decision
  records, specifications, or the change ledger.
- `apps/web` (Next.js), `packages/contracts` (Hardhat), and `packages/ui`
  (React) are placeholder packages pending their respective phases.
- Weekend Premium signal is LOCKED OFF (`SIGNAL_WEEKEND_PREMIUM=false`) until
  the weekend empirical test passes (Spectra.md §2.4).
