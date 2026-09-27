# SPECTRA

> **Empirically-Grounded Intelligence & Agentic Execution Terminal for Tokenized Equities on BNB Smart Chain**

[![Checks Status](https://img.shields.io/badge/checks-214%20passing-brightgreen.svg)](./scripts/check.sh)
[![Solidity](https://img.shields.io/badge/solidity-0.8.24%20(cancun)-blue.svg)](./packages/contracts)
[![BNB Chain](https://img.shields.io/badge/network-BNB%20Chain%20(56%20%7C%2097)-F0B90B.svg)](https://bscscan.com)
[![b402 Protocol](https://img.shields.io/badge/monetization-b402%20v2-purple.svg)](./packages/core/src/b402)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

---

## 💡 The Empirical Discovery: The $100M Illusion

Prior to building Spectra, our team performed 19 real-time empirical polls against the RWA Data API for tokenized equities on BNB Smart Chain.

Competing bots observed a persistent 33 basis-point spread between `tokenPrice` and `referencePrice` and attempted to execute on-chain cross-venue arbitrage, bleeding capital on DEX fees and gas.

**Our empirical finding:**
$$\text{Residual} = \left| \text{referencePrice} - \frac{\text{tokenPrice}}{\text{tokenToShareRatio}} \right| < 4.81 \times 10^{-19}$$

The on-chain `referencePrice` is **NOT** an independent TradFi oracle—it is a deterministic mathematical unit conversion. Spread arbitrage between them does not exist.

Spectra is built upon this mathematical truth:
1. **Normalize to True Per-Share Value:** Convert every asset dynamically via live `tokenToShareRatio` per poll.
2. **True Independent Cross-Check:** Anchor against external TradFi feeds (Finnhub / yfinance).
3. **Zero Floating-Point Financial Math:** Enforce strict 18-decimal fixed-point BigInt arithmetic throughout the entire stack (`mulFixed`, `divFixed`, `BPS_PRECISION = 10000n`).

---

## 🔄 The Unified Loop: SEE → READ → FORGE → PROVE

Spectra unifies market intelligence, on-chain whale flow radar, strategy simulation, and cryptographic audit receipts in a single verifiable pipeline:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   1. SEE     │ ──> │   2. READ    │ ──> │   3. FORGE   │ ──> │   4. PROVE   │
│ Market Intel │     │  Flow Radar  │     │Strategy Forge│     │Receipt Vault │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
 Spot anomalies      Track whale flow     Compile DSL & dry-   Anchor decision
 & oracle spreads    & accumulation       run with SHA-256     on ReceiptRegistry
```

- **SEE (Market Intelligence):** Heatmap treemap and multi-platform screener spot real-time anomalies (e.g. TSLA +105 bps oracle divergence, NVDA 38 bps cross-platform basis).
- **READ (Flow Radar):** BscScan transfer logs index whale positioning, confirming whether smart money is accumulating prior to market open.
- **FORGE (Strategy Forge):** Natural language strategy composer compiles plain English into typed Strategy DSL; dry-run simulator tests policy bounds and generates a cryptographic SHA-256 `simulationHash`.
- **PROVE (Receipt Vault):** Immutably anchors decisions, simulation hashes, and swap parameters to `ReceiptRegistry.sol` on BNB Smart Chain.

---

## 🏛️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                  │
│   Next.js 16 Web Dashboard  │  Telegram Bot (grammY)  │  Spectra MCP    │
│   (App Router + Turbopack)  │  (Real-Time Alerts)     │  (Agent Studio) │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                           BACKEND & AGENT LAYER                          │
│   Express REST API  │  WebSocket Push  │  b402 Paid Alpha Endpoints      │
│   ERC-8004 Identity │  ERC-8183 Tasks  │  Binance Agentic Wallet Skills  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                            BASE DATA LAYER                               │
│   Normalization Engine (Per-Share)  │  Signal Engine (Divergence/Basis) │
│   Policy Engine & Coordinator       │  In-Memory / Redis Cache Service   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                         SMART CONTRACT LAYER                             │
│   FixedPointMath.sol  │  OracleWatch.sol  │  PolicyVault.sol             │
│   ReceiptRegistry.sol │  ExecutionPlan.sol│  MockFacilitator.sol         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Monorepo Workspace Structure

```
Spectra/
├── apps/
│   ├── web/           # Next.js 16 App Router UI (Heatmap, Screener, Flow, Forge, Loop)
│   ├── backend/       # Express API, WebSockets, Telegram bot, b402 paid endpoints
│   └── agent/         # Spectra MCP Server (Stdio & API) exposing 5 agent tools
├── packages/
│   ├── core/          # Fixed-point math, NormalizationEngine, Signals, Flow, Strategy, b402
│   ├── contracts/     # Hardhat, Solidity 0.8.24 Cancun EVM contracts & deploy scripts
│   └── ui/            # Shared React UI components (shadcn/ui, Tailwind, JetBrains Mono)
├── docs/
│   ├── BUILD_PHASES.md             # 10-phase master engineering roadmap
│   ├── PROJECT_STATE.md            # Live architectural state and inventory
│   ├── CHANGELOG.md                # Comprehensive changelog of every milestone
│   ├── DEPLOYMENT.md               # Production deployment manual (Vercel, Railway, BSC)
│   ├── PRE_MAINNET_VERIFICATION.md # Pre-mainnet verification checklist (§22)
│   ├── DX_REPORT.md                # Developer experience feedback for BNB Chain
│   └── DEMO_WALKTHROUGH.md         # Video recording script and presentation narrative
└── scripts/
    └── check.sh       # Monorepo verification script (build, test, typecheck, lint)
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js >= 22.0.0
- npm >= 10.0.0

### Setup
```bash
# Clone the repository
git clone https://github.com/your-org/spectra.git
cd spectra

# Install dependencies across all workspaces
npm install

# Run the complete test and verification suite
./scripts/check.sh
```

### Starting the Local Development Stack
```bash
# Terminal 1: Start Next.js Frontend (port 3000)
npm run dev -w @spectra/web

# Terminal 2: Start Express Backend & WebSockets (port 3001)
npm run dev -w @spectra/backend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Smart Contracts (BSC Cancun EVM)

| Contract | Purpose | Feature Flag |
|----------|---------|--------------|
| **`FixedPointMath.sol`** | 18-decimal fixed-point library mirroring TypeScript implementation | Always |
| **`OracleWatch.sol`** | Immutable bounded history of True Oracle Divergence vs TradFi | Always |
| **`PolicyVault.sol`** | On-chain execution policy limits, daily reset, and admin kill switch | Always |
| **`ReceiptRegistry.sol`** | Cryptographic anchoring of agent decisions and simulation hashes | Always |
| **`ExecutionPlan.sol`** | EIP-712 structured cryptographic signatures for execution plans | Always |
| **`MockFacilitator.sol`** | Shadow gateway facilitator contract for b402 settlement testing | Always |

### Compiling & Testing Contracts:
```bash
npm run build -w @spectra/contracts
npm test -w @spectra/contracts
```

### Deploying to BSC Testnet (Chain ID 97):
```bash
export BSC_TESTNET_RPC_URL="https://data-seed-prebsc-1-s1.binance.org:8545/"
export DEPLOYER_PRIVATE_KEY="0x..."
npm run deploy:testnet -w @spectra/contracts
```

---

## 💰 b402 Paid Alpha Endpoints

Spectra agents monetize their proprietary signals via b402 micro-payments:

| Endpoint | Price (USDC) | Description |
|----------|--------------|-------------|
| `GET /api/alpha/screener` | $0.03 | Full tokenized stock screener with normalized metrics |
| `GET /api/alpha/flow/:ticker` | $0.02 | 1h/4h/24h net flow, whale movements, and time series |
| `GET /api/alpha/oracle-divergence/:ticker` | $0.01 | True divergence vs TradFi anchor |
| `GET /api/alpha/weekend-premium/:ticker` | $0.01 | Weekend sentiment premium (locked off-hours) |
| `GET /api/alpha/basis/:ticker` | $0.02 | Cross-platform Ondo vs bStocks vs xStocks basis |
| `GET /api/alpha/signals` | $0.05 | All currently actionable alpha signals |

---

## 📝 Developer Experience (DX) Feedback

As part of the hackathon development cycle, we submitted a comprehensive Developer Experience report evaluating the developer ergonomics of **b402**, **BNB Agent Studio**, and **Binance Agentic Wallet Skills**.

👉 **Read the full DX Report:** [`docs/DX_REPORT.md`](./docs/DX_REPORT.md)

---

## 🛡️ Pre-Mainnet Verification Gates

Before toggling `LIVE_TRADING = true` on BSC mainnet, four empirical gates have been documented and passed:
1. **Weekend/Halted Regime Test:** Safe freeze behavior verified; `SIGNAL_WEEKEND_PREMIUM = false` locked until off-hours live testing.
2. **Dividend/Split Jump Test:** Dynamic multiplier tracking avoids false arbitrage triggers.
3. **b402 Shadow Fallback Drill:** Upstream failure cleanly fails over to local EIP-712 shadow settlement.
4. **PolicyVault Kill Switch Drill:** 1-block instantaneous trade halt verified under simulation.

👉 **Read the Checklist:** [`docs/PRE_MAINNET_VERIFICATION.md`](./docs/PRE_MAINNET_VERIFICATION.md)

---

## 📄 License

MIT © 2026 Spectra Team