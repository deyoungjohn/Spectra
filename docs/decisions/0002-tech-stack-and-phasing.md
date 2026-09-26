# ADR 0002: Tech stack selection and build phasing

- Status: accepted
- Date: 2026-09-26
- Owners: project owner and Antigravity

## Context

Spectra.md specifies a modular terminal for tokenized equities on BSC. The
blueprint prescribes a 4.5-week timeline and explicit tech choices (Next.js,
Express, Tailwind, shadcn/ui, Vitest, Hardhat, Zustand, wagmi/viem). The
project must be built incrementally so each phase yields a working, testable
product.

## Decision

1. **Monorepo with Turborepo:** Use a Turborepo monorepo with packages
   (`core`, `contracts`, `ui`) and apps (`web`, `backend`, `agent`).
2. **TypeScript everywhere:** All packages and apps use TypeScript with strict
   mode.
3. **BigInt-only financial math:** All price, spread, and ratio calculations
   use `bigint` with 18-decimal fixed-point. ESLint rules block `parseFloat`
   and `Number` on financial identifiers.
4. **10-phase build:** The project is divided into 10 phases (0–9) tracked in
   `docs/BUILD_PHASES.md`. Each phase has explicit acceptance criteria and must
   pass `./scripts/check.sh` before completion.
5. **Base Layer first:** Phases 0–2 establish the data and signal foundation
   before any module or UI work begins, matching the blueprint's dependency
   graph (§4.2).
6. **Feature flags from day one:** Every module and risky feature is gated by
   a flag in `packages/core/src/config/features.ts`.

## Consequences

- Strict phasing prevents half-built modules from blocking the demo.
- The strip-out plan (§17) maps directly to feature flags.
- BigInt-only math prevents the class of floating-point rounding bugs that are
  critical in financial software.
- Turborepo enables independent package builds and caching.

## Alternatives considered

- **Nx monorepo:** Heavier tooling, slower setup. Turborepo is lighter for a
  hackathon-scale project.
- **pnpm workspaces without Turborepo:** Would lose task caching and parallel
  builds.
- **Floating-point with rounding:** Rejected per the empirical findings —
  precision matters for bps calculations.

## Verification

Run `./scripts/check.sh` after Phase 0 scaffolding is complete. All subsequent
phases inherit this verification.
