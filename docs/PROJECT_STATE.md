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
- Phase 2 (Base Layer — Signals & Policy): 🔄 Next up
- Core package (`@spectra/core`) implements:
  - BigInt 18-decimal fixed-point arithmetic (6 functions)
  - Data Ingestion Service with RWA Data API and mock providers
  - Composite TradFi Client (Finnhub primary + Yahoo Finance fallback)
  - Normalization Engine (per-share conversion, ratio drift detection, basis)
  - Memory Cache Service with TTL
- Backend API (`@spectra/backend`) running Express with `/api/health`, `/api/core/status`, and `/api/core/tokens`
- 70 unit and integration tests passing across core and backend
- Zero type errors, zero lint warnings
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
