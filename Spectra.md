```markdown
# Spectra
### The Empirically-Grounded Intelligence & Execution Terminal for Tokenized Equities on BSC

> **Tagline:** *"The reference price is a mirror. We built a window."*
>
> **One-liner:** Spectra is a production-grade, modular terminal that combines
> market screening, on-chain flow analysis, and agentic strategy execution for
> tokenized equities on BNB Smart Chain — architected around empirical proof
> that the RWA Data API's `referencePrice` is a deterministic per-share unit
> conversion of the on-chain price, not an independent TradFi oracle.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [The Empirical Foundation](#2-the-empirical-foundation)
3. [The Unified Loop](#3-the-unified-loop)
4. [System Architecture](#4-system-architecture)
5. [Base Layer — Shared Core Services](#5-base-layer--shared-core-services)
6. [Module 1: Market Intelligence (The Finviz Layer)](#6-module-1-market-intelligence)
7. [Module 2: Strategy Forge (The Composer Layer)](#7-module-2-strategy-forge)
8. [Module 3: Flow Radar (The Quiver Quant Layer)](#8-module-3-flow-radar)
9. [Agent Layer — Execution & Monetization](#9-agent-layer)
10. [Smart Contract Layer](#10-smart-contract-layer)
11. [Design System & UX](#11-design-system--ux)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Redundancy & Fault Tolerance](#13-redundancy--fault-tolerance)
14. [Feasibility & Risk Matrix](#14-feasibility--risk-matrix)
15. [Estimated Budget](#15-estimated-budget)
16. [Build Timeline — 4.5 Weeks](#16-build-timeline)
17. [Modular Strip-Out Plan](#17-modular-strip-out-plan)
18. [Final Deliverables](#18-final-deliverables)
19. [Judging Alignment](#19-judging-alignment)
20. [DX Report Strategy](#20-dx-report-strategy)
21. [Repository Structure](#21-repository-structure)
22. [Pre-Mainnet Verification Checklist](#22-pre-mainnet-verification-checklist)

---

## 1. Product Vision

### The Problem

Tokenized equities on BSC trade 24/7, but the tooling does not exist.
Users who trade tokenized stocks on BNB Chain have:

- **No screener** to filter and compare tokenized stocks across platforms
- **No flow analysis** to see who is accumulating before market events
- **No strategy builder** to automate rules without writing code
- **No independent oracle cross-check** to detect when the on-chain price
  decouples from the real-world stock market
- **No unified terminal** that connects discovery → analysis → execution → proof

The hackathon brief says it plainly:

> *"Tokenized equities landed on-chain faster than the tooling did, so the
> agents, baskets, rebalancers and onboarding flows that will decide how
> people actually trade them mostly have not been written yet."*

### The Solution

Spectra is **one terminal with three lenses**, built on a Base Layer that
encodes empirically verified truth about the data:

| Lens | Web2 Analog | What It Does |
|------|-------------|--------------|
| **Market Intelligence** | Finviz / TradingView Heatmap | Screen, compare, and visualize tokenized stocks with Web3-native anomaly filters |
| **Strategy Forge** | Composer.trade / Alpaca | Build, simulate, and deploy autonomous trading strategies as BNB Agent Studio agents |
| **Flow Radar** | Quiver Quantitative / Unusual Whales | Track on-chain wallet accumulation, cross-platform flows, and smart money movements |

All three lenses share a single **Base Layer** — a unified data pipeline, signal
engine, policy engine, and proof layer — so no logic is duplicated.

### The Empirical Discovery That Powers Everything

During pre-build research, two independent empirical tests were conducted against
the live Binance Web3 RWA Data API (AAPL / Ondo, 19 polls, 10-second cadence,
open-market hours). Both tests converged on the same mathematical truth:

> **`referencePrice = tokenPrice / tokenToShareRatio`**
>
> The spread between `tokenPrice` and `referencePrice` is a **constant
> 33.76 bps** (for AAPL) with **zero variance**. It is a deterministic
> per-share unit conversion, not a tradeable dislocation.

This means:
- Any bot that arbitrages `onchainPrice` vs `referencePrice` is trading against
  a static unit-conversion ratio. It will lose money on gas.
- `referencePrice` carries **zero independent information** beyond the on-chain
  price. It cannot be used as a staleness detector against the on-chain price.
- The **only true independent oracle** is an external TradFi feed (Finnhub,
  yfinance, or a paid SIP feed).

Spectra is the only platform that architects around this empirically proven
reality. Every other team that builds "arbitrage the reference price spread"
will demo a bot that trades against a mirror.

---

## 2. The Empirical Foundation

### 2.1 Test Summary

| Parameter | Value |
|-----------|-------|
| Ticker tested | AAPL (Ondo tokenized Apple, `AAPLon`) |
| Chain / contract | BSC chainId=56 / `0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4` |
| Samples | 19 polls × 10 seconds (~3 minutes) |
| Market status | OPEN (Friday regular session) |
| `sharesMultiplier` | 1.003376073740221058 (constant) |
| External anchor | yfinance `AAPL.fast_info.lastPrice` |

### 2.2 Key Findings

| Finding | Evidence | Implication |
|---------|----------|-------------|
| `referencePrice` is a unit conversion | All 19 pairs match `tokenPrice / tokenToShareRatio` with max residual $4.81e-19 | The onchain_vs_ref spread is NOT tradeable |
| Spread is constant | `onchain_vs_ref_spread_bps` = 33.7607 across all 19 samples, stdev = 0.000000 | No arbitrage opportunity exists between these two fields |
| On-chain tracks TradFi during open hours | Pearson(ref, yfinance) = 0.72–0.81 at 0–10s lag; ref_vs_tradfi spread ±3 bps | The on-chain oracle is healthy during open hours |
| No staleness during open hours | `referencePrice` froze 0 of 17 intervals | Staleness detection must target closed/halted regimes |
| `stockInfo.price` is coarse | 3 distinct steps over 18 polls; −5 to −16 bps behind | Never use `stockInfo.price` as a live anchor |
| Closed-market behavior is UNTESTED | Both reports explicitly flag this gap | Weekend/halt regime is the highest-risk, highest-opportunity zone |

### 2.3 Architectural Mandates from the Data

1. **Normalize everything to per-share.** Divide by the live `tokenToShareRatio`
   fetched per poll. Never hardcode; it drifts with dividends and jumps on splits.
2. **Never use `referencePrice` as an independent oracle.** It is the on-chain
   leg expressed in different units. Assign it 0% weight as an independent
   TradFi signal.
3. **Use external TradFi as the true cross-check.** Finnhub (or yfinance in dev)
   is the only independent vote. Alert if `ref_vs_tradfi_spread > 10 bps`;
   halt if `> 25–50 bps`.
4. **Open-market regime:** Weight the on-chain leg as primary fair value.
   Monitor `ref_vs_tradfi_spread` continuously.
5. **Closed/halt regime (assumed hostile):** Down-weight oracle to 0. Fall back
   to last-regular-close + wide tolerance. Re-run empirical test overnight/weekend
   to calibrate freeze behavior before trusting any price off-hours.
6. **Keep HMAC signing code.** The public RWA endpoint requires no auth, but
   private order endpoints will. The signing path is preserved for production.

### 2.4 Weekend Empirical Test Gate

#### The Problem

Both empirical test reports explicitly state:

> *"Closed/halt regime (untested here — assumed hostile)"*
> *"After-hours / halted / corporate-action regimes were not sampled"*
> *"Repeat this script around 16:00 ET or during a trading halt"*

The Weekend Sentiment Premium signal is an **assumption**, not a measured fact.
Shipping it without validation risks:
- The `referencePrice` freezing entirely (no tick data)
- The on-chain DEX price also freezing (no liquidity)
- The `tokenToShareRatio` behaving differently off-hours
- `statusInfo.reasonCode` returning unexpected values

#### The Gate

**The Weekend Premium signal is feature-flagged OFF until the weekend empirical
test passes.** It cannot be enabled in production without this test.

---

## 3. The Unified Loop

Spectra operates as a continuous intelligence-to-execution loop:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        THE Spectra LOOP                           │
│                                                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│   │  SEE     │───▶│  READ    │───▶│  FORGE   │───▶│  PROVE   │     │
│   │          │    │          │    │          │    │          │     │
│   │ Market   │    │ Flow     │    │ Strategy │    │ On-chain │     │
│   │ Intel    │    │ Radar    │    │ Forge    │    │ Receipts │     │
│   │ (Module1)│    │ (Module3)│    │ (Module2)│    │ (Base)   │     │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘     │
│        │               │               │               │           │
│        ▼               ▼               ▼               ▼           │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    BASE LAYER                               │   │
│   │                                                             │   │
│   │  Data Ingestion │ Normalization Engine │ Signal Engine      │   │
│   │  Policy Engine  │ Receipt Registry     │ Payment Gateway    │   │
│   │  Auth & Session │ Notification Svc     │ Config & Flags     │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    AGENT LAYER                               │   │
│   │                                                             │   │
│   │  BNB Agent Studio │ Agentic Wallet │ b402 Payments          │   │
│   │  MCP Server       │ Wallet Skills  │ Shadow Gateway         │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**The user journey:**

1. **SEE** — Open the Market Intelligence heatmap. Spot that TSLA on-chain is
   trading at a 105 bps premium vs the frozen TradFi close. Notice that bStocks
   NVDA is 38 bps cheaper than Ondo NVDA.

2. **READ** — Switch to Flow Radar. See that three large BSC wallets accumulated
   Ondo AAPL in the last 4 hours, before Monday's market open.

3. **FORGE** — Open Strategy Forge. Build a rule: "If cross-platform basis > 20 bps
   AND Flow Radar shows net accumulation > $5k, execute rotation via Agentic Wallet."

4. **PROVE** — Every decision, simulation, and execution is anchored on-chain
   via ReceiptRegistry. The agent's track record is public and verifiable.

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Web Dashboard │  │ Telegram Bot │  │ MCP Server   │  │ REST API   │  │
│  │ (Next.js)    │  │ (grammY)     │  │ (Agent Studio│  │ (b402 paid │  │
│  │              │  │              │  │  auto-reg)   │  │  endpoints)│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                 │                 │         │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Next.js API Routes / Express Backend                           │    │
│  │                                                                 │    │
│  │  /api/market/*      → Module 1 endpoints                       │    │
│  │  /api/forge/*       → Module 2 endpoints                       │    │
│  │  /api/flow/*        → Module 3 endpoints                       │    │
│  │  /api/alpha/*       → b402 paid data endpoints                 │    │
│  │  /api/core/*        → Base layer endpoints                     │    │
│  │                                                                 │    │
│  │  Middleware: Auth │ Rate Limiting │ Feature Flags │ b402 Gate   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BASE LAYER                                     │
│                                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │
│  │ Data       │ │ Normalize  │ │ Signal     │ │ Policy Engine      │   │
│  │ Ingestion  │ │ Engine     │ │ Engine     │ │                    │   │
│  │ Service    │ │            │ │            │ │ Budgets, allowlists│   │
│  │            │ │ Per-share  │ │ Oracle Div │ │ slippage caps,     │   │
│  │ RWA API    │ │ conversion │ │ Weekend    │ │ cooldowns,         │   │
│  │ Market API │ │ Ratio      │ │ Premium    │ │ kill switch        │   │
│  │ Trading API│ │ tracking   │ │ Basis      │ │                    │   │
│  │ Wallet API │ │ Multiplier │ │ Flow       │ │                    │   │
│  │ DeFi API   │ │ drift      │ │ Liquidity  │ │                    │   │
│  │ External   │ │            │ │            │ │                    │   │
│  │ TradFi API │ │            │ │            │ │                    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘   │
│                                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │
│  │ Receipt    │ │ Payment    │ │ Auth &     │ │ Notification       │   │
│  │ Service    │ │ Gateway    │ │ Session    │ │ Service            │   │
│  │            │ │            │ │            │ │                    │   │
│  │ On-chain   │ │ b402 V2    │ │ Wallet     │ │ Telegram push      │   │
│  │ anchoring  │ │ Shadow GW  │ │ connect    │ │ WebSocket push     │   │
│  │ Decision   │ │ Bazaar ext │ │ Session    │ │ Email (stretch)    │   │
│  │ hashing    │ │            │ │ keys       │ │                    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Config & Feature Flags                                          │   │
│  │  MODULE_1_ENABLED=true │ MODULE_2_ENABLED=true │ MODULE_3_ENABLED│   │
│  │  B402_MODE=auto|official|shadow │ TRADFI_SOURCE=finnhub|yfinance │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        STORAGE LAYER                                    │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ PostgreSQL   │  │ Redis        │  │ BSC Mainnet  │  │ File Store │  │
│  │ (Supabase)   │  │ (Upstash)    │  │ (Contracts)  │  │ (IPFS opt) │  │
│  │              │  │              │  │              │  │            │  │
│  │ Price cache  │  │ Real-time    │  │ OracleWatch  │  │ Report     │  │
│  │ Signal history│ │ pub/sub      │  │ PolicyVault  │  │ artifacts  │  │
│  │ Flow events  │  │ Rate limit   │  │ ReceiptReg.  │  │            │  │
│  │ User configs │  │ counters     │  │ StrategyReg. │  │            │  │
│  │ Audit logs   │  │              │  │              │  │            │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL DATA SOURCES                             │
│                                                                         │
│  Binance Web3 APIs:          External APIs:                             │
│  ├── RWA Data API            ├── Finnhub (TradFi prices, primary)      │
│  ├── Market API              ├── yfinance (TradFi fallback, dev)       │
│  ├── Trading API             ├── BscScan API (wallet tracking)         │
│  ├── Transaction API         └── Earnings Calendar API (stretch)       │
│  ├── Wallet API                                                         │
│  ├── DeFi API                                                           │
│  └── b402 Payments                                                      │
│                                                                         │
│  AI Execution Layer:                                                    │
│  ├── Agentic Wallet / Wallet Skills                                     │
│  ├── BNB Agent Studio                                                   │
│  └── PancakeSwap / BSC DEX liquidity                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Module Dependency Graph

```
                    ┌─────────────────────┐
                    │   Config & Flags    │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  Module 1  │  │  Module 2  │  │  Module 3  │
     │  Market    │  │  Strategy  │  │  Flow      │
     │  Intel     │  │  Forge     │  │  Radar     │
     └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
           │               │               │
           │    reads      │  reads/writes │  reads
           ▼               ▼               ▼
     ┌─────────────────────────────────────────────┐
     │              BASE LAYER                      │
     │                                             │
     │  DataIngestion ──▶ NormalizeEngine          │
     │       │                  │                  │
     │       ▼                  ▼                  │
     │  SignalEngine ◀── PolicyEngine              │
     │       │                  │                  │
     │       ▼                  ▼                  │
     │  ReceiptService    PaymentGateway           │
     │       │                  │                  │
     │       ▼                  ▼                  │
     │  NotificationSvc   AuthService              │
     └─────────────────────────────────────────────┘
```

**Critical rule:** Modules NEVER call Binance APIs directly. They always go
through the Base Layer. This ensures:
- No duplicated API integration code
- Single point for rate limiting and caching
- Single point for error handling and retry logic
- Easy to swap data sources without touching modules

---

## 5. Base Layer — Shared Core Services

The Base Layer is the foundation. Every module depends on it. Nothing in the
Base Layer depends on any module.

### 5.1 Data Ingestion Service

**Responsibility:** Poll all data sources, normalize responses, write to cache.

| Source | What It Fetches | Poll Interval | Cache TTL |
|--------|----------------|---------------|-----------|
| RWA Data API | Token list, `tokenPrice`, `tokenToShareRatio`, market status, next open, sector filters | 30s | 60s |
| Market API | Candles, token analytics, volatility | 60s | 120s |
| Trading API | Cross-DEX quotes, liquidity depth | 30s | 60s |
| Wallet API | User balances, positions | On-demand | 30s |
| DeFi API | Protocol TVL, APY, positions | 300s | 600s |
| Finnhub (TradFi) | Real-time stock prices, earnings calendar | 60s | 120s |
| yfinance (fallback) | Stock prices if Finnhub fails | 60s | 120s |
| BscScan API | Token transfer events, wallet activity | 30s | 60s |

### 5.2 Normalization Engine

**Responsibility:** Convert all prices to a unified per-share representation
using the live `tokenToShareRatio`. This is the core empirical finding encoded
into the architecture.

```typescript
interface NormalizedStock {
  ticker: string;
  platform: Platform;
  tokenAddress: string;

  // ALL prices are bigint, 18-decimal fixed point
  tokenPrice: bigint;          // Per-token on-chain price
  tokenToShareRatio: bigint;   // Live ratio, fetched per poll
  perSharePrice: bigint;       // = divFixed(tokenPrice, tokenToShareRatio)
  tradfiPrice: bigint;         // External TradFi anchor

  // Spreads are integer basis points (bigint)
  oracleDivergenceBps: bigint;
  weekendPremiumBps: bigint;
  crossPlatformBasisBps: bigint;

  // Liquidity
  dexLiquidityUsd: bigint;     // In smallest stablecoin unit
  slippageBps: bigint;         // Integer bps

  marketStatus: MarketStatus;
  nextOpenTime: Date;
  lastUpdated: Date;
}
```

#### 5.2.1 TypeScript Fixed-Point Arithmetic

```typescript
// core/normalize/fixed-point.ts

const PRECISION = 10n ** 18n;
const BPS_PRECISION = 10_000n;

/** Multiply two 18-dec fixed-point BigInts */
export function mulFixed(a: bigint, b: bigint): bigint {
  return (a * b) / PRECISION;
}

/** Divide two 18-dec fixed-point BigInts */
export function divFixed(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new Error("Division by zero");
  return (a * PRECISION) / b;
}

/** Compute spread in integer basis points */
export function spreadBps(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("Division by zero");
  const ratio = (numerator * BPS_PRECISION) / denominator;
  return ratio - BPS_PRECISION;
}

/** Convert per-token price to per-share price */
export function toPerShare(tokenPrice: bigint, tokenToShareRatio: bigint): bigint {
  return divFixed(tokenPrice, tokenToShareRatio);
}

/** Parse a decimal string like "335.02" into 18-dec BigInt */
export function parseToFixed18(value: string): bigint {
  const parts = value.split(".");
  const whole = BigInt(parts[0]) * PRECISION;
  if (parts.length === 1) return whole;
  const decimals = parts[1].padEnd(18, "0").slice(0, 18);
  return whole + BigInt(decimals);
}

/** Format 18-dec BigInt to human-readable string */
export function formatFixed18(value: bigint): string {
  const abs = value < 0n ? -value : value;
  const sign = value < 0n ? "-" : "";
  const whole = abs / PRECISION;
  const frac = abs % PRECISION;
  return `${sign}${whole}.${frac.toString().padStart(18, "0")}`;
}
```

#### 5.2.2 Lint Enforcement

```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-globals": ["error", "parseFloat", "Number"],
    "no-restricted-syntax": [
      "error",
      {
        "selector": "BinaryExpression[operator='/'] > Identifier[name=/price|amount|spread|bps|ratio/i]",
        "message": "Use FixedPointMath.divFixed() or BigInt division. Never use floating-point division for financial values."
      }
    ]
  }
}
```

### 5.3 Signal Engine

**Responsibility:** Generate actionable signals from normalized data.

| Signal | Name | Computation | Trigger Threshold | Regime |
|--------|------|-------------|-------------------|--------|
| A | Oracle Divergence | `(perSharePrice - tradfiPrice) / tradfiPrice * 10000` during OPEN hours | Alert > 10 bps, Halt > 25 bps | OPEN only |
| B | Weekend Sentiment Premium | `(perSharePrice - frozenTradfiClose) / frozenTradfiClose * 10000` during CLOSED hours | ±100 bps | CLOSED only |
| C | Cross-Platform Basis | `min(perSharePrice across platforms) vs max(perSharePrice across platforms)` net of slippage | > 20 bps net | Any |
| D | Flow Accumulation | Net token transfers into top-N wallets over trailing 4 hours | > $5,000 net | Any |
| E | Liquidity Alert | DEX liquidity depth below threshold for trade size | Depth < $1,000 | Any |
| F | Ratio Drift | `tokenToShareRatio` changed vs last known value | Any change | Any |

**Signal A is the key innovation.** It replaces the flawed "ref vs onchain
staleness" signal with the empirically correct "onchain vs TradFi divergence"
signal. This is the only signal that can detect a true oracle failure.

Each signal emits a structured event:

```typescript
interface AlphaSignal {
  id: string;
  type: "ORACLE_DIVERGENCE" | "WEEKEND_PREMIUM" | "BASIS" | "FLOW" | "LIQUIDITY" | "RATIO_DRIFT";
  ticker: string;
  severity: "info" | "warning" | "critical";
  value: number;
  context: Record<string, any>;
  timestamp: Date;
  actionable: boolean;
  regime: "OPEN" | "CLOSED" | "ANY";
}
```

### 5.4 Policy Engine

**Responsibility:** Enforce execution constraints for all agent actions.
Backed by `PolicyVault.sol` on-chain.

```typescript
interface ExecutionPolicy {
  userId: string;
  maxTradeNotionalUsd: number;    // e.g., $10
  maxSlippageBps: number;         // e.g., 100
  cooldownSeconds: number;        // e.g., 300
  dailyLimitUsd: number;          // e.g., $50
  allowedTokens: string[];        // Token addresses
  killSwitch: boolean;
}
```

### 5.5 Receipt Service

**Responsibility:** Anchor every agent decision on-chain for verifiability.

```typescript
interface ExecutionReceipt {
  decisionHash: string;     // SHA-256 of signal + reasoning
  simulationHash: string;   // SHA-256 of Transaction API simulation result
  quoteHash: string;        // SHA-256 of Trading API quote
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut: string;
  actualAmountOut: string;
  slippageBps: number;
  signalType: string;
  timestamp: number;
}
```

### 5.6 Payment Gateway (b402 + Shadow Fallback)

**Responsibility:** Handle all paid API access via b402, with automatic fallback.

```typescript
class PaymentGateway {
  private mode: "official" | "shadow";

  constructor() {
    this.mode = await this.checkB402Readiness() ? "official" : "shadow";
  }

  async verifyPayment(paymentPayload, paymentRequirements) {
    if (this.mode === "official") {
      // POST /build/api/v2/b402/verify
      // Headers: X-OC-APIKEY, X-OC-TIMESTAMP, X-OC-SIGN
      // Body: {"body": {x402Version: 2, paymentPayload, paymentRequirements}}
      return await postB402("verify", {
        x402Version: 2,
        paymentPayload,
        paymentRequirements,
      });
    } else {
      return await this.shadowVerify(paymentPayload, paymentRequirements);
    }
  }

  async settlePayment(paymentPayload, paymentRequirements, settleAmount?) {
    if (this.mode === "official") {
      return await postB402("settle", {
        x402Version: 2,
        paymentPayload,
        paymentRequirements,
        ...(settleAmount && { settleAmount }),
      });
    } else {
      return await this.shadowSettle(paymentPayload, paymentRequirements);
    }
  }
}
```

**b402 Implementation Notes (from b402.md):**

- Use V2 endpoints: `POST /build/api/v2/b402/{supported,verify,settle}`
- Outer envelope: Sign and send `{"body": ...}`, not only the inner x402 object
- HMAC-SHA256 signing: `timestamp + "POST" + requestPath + rawBody`
- Headers: `X-OC-APIKEY`, `X-OC-TIMESTAMP` (ISO-8601), `X-OC-SIGN` (Base64)
- Readiness check: `POST /api/v2/b402/supported` with `{"body":{}}` must return
  envelope code `000000000`
- Error `1160401` = B402 onboarding not completed
- Error `40104` = API Key access policy rejected (check B402 Payments permission
  and IP whitelist)
- `payTo` address is write-once from Developer Portal onboarding
- Never expose Secret Key in browser code, logs, or source control
- Supported assets on BSC mainnet: U, USD1, USDC, USDT
- Amounts are unsigned decimal strings in smallest unit (e.g., `"1000000"` = 1 USDC)

**Bazaar Extension (for agent discoverability):**

Include in V2 Settle request under `paymentPayload.extensions.bazaar`:

```json
{
  "description": "Spectra Tokenized Equity Intelligence Feed",
  "routeTemplate": "/api/alpha/:signal/:ticker",
  "info": {
    "input": {
      "type": "http",
      "method": "GET",
      "pathParams": {
        "signal": "oracle-divergence | weekend-premium | basis | flow",
        "ticker": "AAPL"
      }
    }
  },
  "schema": { ... }
}
```

**Paid Endpoints:**

| Endpoint | Price | Module | Description |
|----------|-------|--------|-------------|
| `GET /api/alpha/oracle-divergence/:ticker` | 0.01 USDC | Base | Oracle divergence vs TradFi |
| `GET /api/alpha/weekend-premium/:ticker` | 0.01 USDC | Base | Weekend sentiment premium |
| `GET /api/alpha/basis/:ticker` | 0.02 USDC | Base | Cross-platform basis + route |
| `GET /api/alpha/flow/:ticker` | 0.02 USDC | Module 3 | Smart money flow data |
| `GET /api/alpha/signals` | 0.05 USDC | Base | All active signals snapshot |
| `GET /api/alpha/screener` | 0.03 USDC | Module 1 | Full screener data export |

### 5.7 Notification Service

| Channel | Use Case |
|---------|----------|
| WebSocket (browser) | Real-time dashboard updates |
| Telegram Bot | Alerts, trade confirmations, policy changes |
| On-chain Events | Permanent audit trail via contract events |

### 5.8 Config & Feature Flags

```typescript
const FEATURES = {
  MODULE_1_MARKET_INTEL: true,
  MODULE_2_STRATEGY_FORGE: true,
  MODULE_3_FLOW_RADAR: true,
  B402_MODE: "auto",           // "official" | "shadow" | "auto"
  TRADFI_SOURCE: "finnhub",    // "finnhub" | "yfinance"
  AGENT_STUDIO_ENABLED: true,
  TELEGRAM_ALERTS: true,
  LIVE_TRADING: false,         // Enable only after testing
  MAX_LIVE_TRADE_USD: 10,
  VISUAL_STRATEGY_BUILDER: false, // REMOVED — ship NL + templates instead
  SIGNAL_WEEKEND_PREMIUM: false,  // LOCKED until weekend empirical test passes
};
```

### 5.9 Strategy Conflict Resolution

When multiple strategies (e.g., a DCA template buying NVDA and an Oracle Divergence Guard trying to halt NVDA trading) fire simultaneously, the Signal Engine must not allow contradictory actions.

Implement a lightweight Coordinator inspired by Nexus's Portfolio Coordinator:
1. Lock the portfolio for planning.
2. Collect all pending strategy proposals for this decision window.
3. Apply priority order: Kill switch > Policy limits > Active alerts (halt signals) > Scheduled DCA > Tactical NL strategies.
4. Net compatible actions. Reject contradictory ones with a reason code.
5. Reserve cash/inventory transactionally.
6. Emit the surviving proposals to the Execution pipeline.

**Worked Conflict Example (Nexus inspired):**
Assume a $1,000 portfolio, $200 cash, $280 NVDA exposure, and $120 AMD exposure. Fees omitted. A confirmed Oracle Divergence Guard caps NVDA at 25%; the semiconductor cap is 40%.

| Proposal | Requested change | Coordinator decision |
|---|---:|---|
| Scheduled DCA | Buy $60 NVDA | Reject while the event cap is active |
| Divergence Guard | Reduce NVDA to $250 | Accept $30 sell |
| Tactical Rule | Buy $50 AMD | Reduce to $30 buy |

The combined result is NVDA $250, AMD $150, and cash $200. The decision record explains that $60 of accumulation was blocked and $20 of tactical demand was clipped.

**Reason Codes:** `KILL_SWITCH`, `POLICY_LIMIT`, `HALT_SIGNAL_ACTIVE`, `INSUFFICIENT_CASH`, `COOLDOWN_ACTIVE`, `CONFLICTING_DIRECTION`, `LIQUIDITY_INSUFFICIENT`.

### 5.10 Missing Data as a Product State

Missing or stale data is never silently ignored. It is surfaced in the UI, logged in the decision record, and blocks dependent automation. The system fails closed, not open.

| Condition | Spectra Behavior |
|---|---|
| TradFi feed unavailable (Finnhub down) | Suspend Oracle Divergence signal. Show timestamped last-known value on dashboard. Block strategy execution that depends on this signal. |
| RWA Data API unavailable | Serve cached data with staleness badge. Block all trade execution. |
| Token halted | Block trades for that instrument. Show HALTED badge on heatmap. Do not fire any strategy for that ticker. |
| referencePrice stale outside session | Apply explicit closed-market policy (from Weekend Test Gate). |
| tokenToShareRatio changed | Fire Ratio Drift signal. Invalidate cached per-share prices. Recompute all spreads. Block strategies until recomputation completes. |
| BscScan API down (Module 3) | Flow Radar shows stale data with timestamp. Flow-based strategy conditions suspend. |
| Earnings calendar unconfirmed | If a future earnings strategy exists, show "unconfirmed" label. Do not auto-position. |
| DEX liquidity below threshold | Show liquidity warning. Reduce max trade size or block execution. |

---

## 6. Module 1: Market Intelligence

### The Finviz Layer

**Feature flag:** `MODULE_1_MARKET_INTEL`

### 6.1 Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Treemap Heatmap** | Visual heatmap of tokenized stocks, color-coded by signal type | P0 |
| **Screener Table** | Filterable table: ticker, platform, perSharePrice, tradfiPrice, spreads, liquidity | P0 |
| **Web3 Anomaly Filters** | Filter by: Oracle Divergence > X bps, Weekend Premium > X bps, Cross-Platform Basis > X bps, Ratio Drift | P0 |
| **Sector Views** | Magnificent 7, AI Chips, ETF, Buffett Portfolio (from RWA API sector filters) | P1 |
| **Ticker Detail Page** | Per-share price chart, oracle divergence history, liquidity depth, flow summary | P1 |
| **Platform Comparison** | Side-by-side comparison of bStocks vs Ondo vs xStocks for same ticker | P1 |
| **Market Status Banner** | Global market open/closed indicator with next-open countdown | P0 |
| **Alert Configuration** | User sets thresholds for Telegram alerts on any signal | P2 |

### 6.2 Data Dependencies

```
Module 1 reads from:
  ├── DataIngestionService.getStockList()
  ├── DataIngestionService.getMarketStatus()
  ├── NormalizeEngine.getAll()
  ├── SignalEngine.getActiveSignals()
  └── FlowRadar.getNetFlow() (if Module 3 enabled)
```

### 6.3 UI Components

```
/market
├── HeatmapView          # Treemap with signal-based coloring
├── ScreenerTable        # Filterable data table
├── SectorTabs           # Mag7, AI Chips, ETF, Buffett
├── MarketStatusBanner   # Open/Closed + countdown
└── AnomalyFilters       # Oracle Div, Weekend Premium, Basis, Ratio Drift

/market/ticker/[ticker]
├── PerSharePriceChart   # Normalized price vs TradFi anchor
├── OracleDivergenceChart # Spread history vs external TradFi
├── LiquidityPanel       # Depth estimation
├── PlatformComparison   # bStocks vs Ondo vs xStocks
└── FlowSummary          # Net accumulation (from Module 3)
```

### 6.4 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/market/heatmap` | Public | Heatmap data for all tracked tickers |
| GET | `/api/market/screener` | Public | Filtered screener results |
| GET | `/api/market/ticker/:ticker` | Public | Ticker detail with normalized prices |
| GET | `/api/market/sectors/:sector` | Public | Sector-filtered stock list |
| GET | `/api/market/status` | Public | Market open/closed + next open |
| GET | `/api/market/anomalies` | b402 | Active anomaly signals (paid) |

---

## 7. Module 2: Strategy Forge

### The Composer Layer

**Feature flag:** `MODULE_2_STRATEGY_FORGE`

### 7.1 Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Visual Strategy Builder** | Drag-and-drop condition → action blocks | REMOVED |
| **Natural Language Input** | Type strategy in plain English, compile to policy JSON | P1 |
| **Strategy Simulator** | Backtest/simulate strategy against cached historical data | P1 |
| **Agent Deployment** | Deploy strategy as BNB Agent Studio autonomous agent | P0 |
| **Policy Binding** | Bind strategy to PolicyVault constraints | P0 |
| **Execution Log** | View all agent decisions with receipts | P0 |
| **Strategy Templates** | Pre-built templates: DCA, Rebalance, Basis Rotation, Premium Fade | P2 |

### 7.2 Strategy Block Types

**Condition Blocks (Triggers):**

```typescript
type ConditionBlock =
  | { type: "PRICE_ABOVE"; ticker: string; price: number }
  | { type: "PRICE_BELOW"; ticker: string; price: number }
  | { type: "ORACLE_DIVERGENCE_ABOVE"; ticker: string; divergenceBps: number }
  | { type: "WEEKEND_PREMIUM_ABOVE"; ticker: string; premiumBps: number }
  | { type: "CROSS_PLATFORM_BASIS_ABOVE"; ticker: string; basisBps: number }
  | { type: "FLOW_ACCUMULATION_ABOVE"; ticker: string; usdAmount: number }
  | { type: "RATIO_DRIFT_DETECTED"; ticker: string }
  | { type: "MARKET_OPENS" }
  | { type: "MARKET_CLOSES" }
  | { type: "TIME_SCHEDULE"; cron: string }
  | { type: "VOLATILITY_ABOVE"; ticker: string; threshold: number };
```

**Action Blocks (Executions):**

```typescript
type ActionBlock =
  | { type: "BUY"; ticker: string; platform: Platform; amountUsd: number }
  | { type: "SELL"; ticker: string; platform: Platform; amountUsd: number }
  | { type: "ROTATE"; fromPlatform: Platform; toPlatform: Platform; ticker: string }
  | { type: "REBALANCE"; targetAllocations: Record<string, number> }
  | { type: "ALERT"; channel: "telegram" | "dashboard"; message: string }
  | { type: "PAUSE"; durationHours: number }
  | { type: "KILL_SWITCH" };
```

### 7.3 Strategy Compilation

```
User Input (Natural Language or Visual Blocks)
    │
    ▼
Strategy DSL (JSON)
    │
    ├──▶ Validate against allowed block types
    ├──▶ Check PolicyVault constraints
    ├──▶ Simulate via Transaction API (dry run)
    │
    ▼
Deployed Agent
    │
    ├──▶ BNB Agent Studio (ERC-8004 identity)
    ├──▶ Agentic Wallet (Wallet Skills execution)
    ├──▶ PolicyVault.sol (on-chain constraints)
    └──▶ ReceiptRegistry.sol (audit trail)
```

### 7.4 Example: Natural Language → Deployed Agent

**User types:**

```
"Rotate my Ondo AAPL to bStocks AAPL whenever the cross-platform basis
exceeds 20 bps and Flow Radar shows net accumulation above $5,000.
Max trade $10, max slippage 1%."
```

**Strategy Forge compiles to:**

```json
{
  "name": "AAPL Basis Rotation",
  "trigger": {
    "type": "AND",
    "conditions": [
      { "type": "CROSS_PLATFORM_BASIS_ABOVE", "ticker": "AAPL", "basisBps": 20 },
      { "type": "FLOW_ACCUMULATION_ABOVE", "ticker": "AAPL", "usdAmount": 5000 }
    ]
  },
  "action": {
    "type": "ROTATE",
    "ticker": "AAPL",
    "fromPlatform": "ONDO",
    "toPlatform": "BSTOCKS"
  },
  "policy": {
    "maxTradeNotionalUsd": 10,
    "maxSlippageBps": 100,
    "cooldownSeconds": 300
  }
}
```

### 7.5 Data Dependencies

```
Module 2 reads from:
  ├── SignalEngine.getActiveSignals()     (for condition evaluation)
  ├── NormalizeEngine.getAll()             (for price-based conditions)
  ├── FlowRadar.getNetFlow()              (for flow-based conditions)
  ├── PolicyEngine.checkPolicy()          (for execution validation)
  └── DataIngestionService.getStockList() (for ticker resolution)

Module 2 writes to:
  ├── PolicyVault.sol                     (on-chain policy)
  ├── ReceiptRegistry.sol                 (execution receipts)
  └── Agentic Wallet                      (trade execution)
```

### 7.6 UI Components

```
/forge
├── TemplateGallery       # 4 pre-built templates, one-click deploy
├── NLInput               # Text box: "Describe your strategy in plain English"
├── StrategyPreview       # Compiled DSL as readable JSON (not visual blocks)
├── Simulator             # Dry-run results table
├── DeployButton          # "Deploy to Agent Studio"
└── ExecutionLog          # Past executions with receipt links

/forge/strategies
├── StrategyList          # User's deployed strategies
└── StrategyDetail        # Execution log, receipts, P&L
```

### 7.7 Pre-built Strategy Templates

```typescript
const STRATEGY_TEMPLATES = [
  {
    id: "dca-weekly",
    name: "Weekly DCA",
    description: "Buy $X of a tokenized stock every Monday at market open",
    dsl: {
      trigger: { type: "TIME_SCHEDULE", cron: "0 13 * * 1" },
      action: { type: "BUY", ticker: "{{TICKER}}", amountUsd: "{{AMOUNT}}" },
      policy: { maxSlippageBps: 100, cooldownSeconds: 0 },
    },
  },
  {
    id: "basis-rotation",
    name: "Cross-Platform Basis Rotation",
    description: "Rotate between platforms when basis exceeds threshold",
    dsl: {
      trigger: { type: "CROSS_PLATFORM_BASIS_ABOVE", ticker: "{{TICKER}}", basisBps: 20 },
      action: { type: "ROTATE", ticker: "{{TICKER}}" },
      policy: { maxTradeNotionalUsd: 10, maxSlippageBps: 100, cooldownSeconds: 300 },
    },
  },
  {
    id: "oracle-divergence-halt",
    name: "Oracle Divergence Guard",
    description: "Alert and halt if on-chain price diverges from TradFi",
    dsl: {
      trigger: { type: "ORACLE_DIVERGENCE_ABOVE", ticker: "{{TICKER}}", divergenceBps: 25 },
      action: { type: "ALERT", channel: "telegram", message: "Oracle divergence detected" },
      policy: {},
    },
  },
  {
    id: "weekend-premium-fade",
    name: "Weekend Premium Fade",
    description: "Sell when weekend premium exceeds threshold, buy back at open",
    dsl: {
      trigger: { type: "WEEKEND_PREMIUM_ABOVE", ticker: "{{TICKER}}", premiumBps: 150 },
      action: { type: "SELL", ticker: "{{TICKER}}", platform: "AUTO" },
      policy: { maxTradeNotionalUsd: 10, maxSlippageBps: 150 },
    },
  },
];
```

---

## 8. Module 3: Flow Radar

### The Quiver Quant Layer

**Feature flag:** `MODULE_3_FLOW_RADAR`

### 8.1 Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Wallet Accumulation Tracker** | Track top-N wallets accumulating tokenized stocks | P0 |
| **Net Flow Chart** | Time-series chart of net inflows/outflows per ticker | P0 |
| **Pre-Event Positioning** | Detect accumulation before earnings or market open | P1 |
| **Cross-Platform Flow** | Show flows between bStocks, Ondo, xStocks representations | P1 |
| **Whale Alert** | Alert when a single wallet moves > $X of a tokenized stock | P2 |
| **Flow-Signal Correlation** | Overlay flow data on per-share price chart | P2 |

### 8.2 Data Pipeline

```
BscScan API (Token Transfer Events)
    │
    ▼
Flow Aggregator
    │
    ├── Group by ticker + platform
    ├── Identify top-N wallets by holdings
    ├── Compute net flow (inflows - outflows) per time window
    ├── Detect accumulation patterns
    │
    ▼
Flow Signal Engine
    │
    ├── FLOW_ACCUMULATION signal (net inflow > threshold)
    ├── FLOW_DISTRIBUTION signal (net outflow > threshold)
    ├── WHALE_MOVEMENT signal (single wallet > threshold)
    │
    ▼
PostgreSQL (flow_events table)
    │
    ▼
Module 3 UI + Signal Engine (Base Layer)
```

### 8.3 Data Dependencies

```
Module 3 reads from:
  ├── BscScan API (token transfer events)
  ├── DataIngestionService.getStockList() (token addresses)
  └── DataIngestionService.getMarketStatus() (for pre-event detection)

Module 3 writes to:
  ├── SignalEngine.emitFlowSignal()       (for cross-module consumption)
  └── PostgreSQL flow_events table        (for historical analysis)
```

### 8.4 UI Components

```
/flow
├── FlowDashboard         # Overview: top accumulations, distributions
├── TickerFlowChart       # Net flow time-series per ticker
├── WhaleTable            # Top wallets and their positions
├── PreEventPanel         # Accumulation before earnings/market open
└── CrossPlatformFlow     # Flow between bStocks/Ondo/xStocks

/flow/ticker/[ticker]
├── FlowChart             # Detailed flow chart
├── WalletList            # Individual wallet breakdown
└── PriceOverlay          # Flow overlaid on per-share price chart
```

---

## 9. Agent Layer

### Execution, Identity, and Monetization

The Agent Layer is not a module. It is the execution and monetization layer
that sits on top of the Base Layer and is consumed by Modules 2 and 3.

### 9.1 BNB Agent Studio Integration

| Feature | Implementation |
|---------|---------------|
| Agent Identity | ERC-8004 identity registered via Agent Studio |
| Autonomous Runtime | Managed cloud runtime runs strategy agents 24/7 |
| Task Interface | ERC-8183 task interface for inter-agent communication |
| MCP Auto-Registration | Agent's MCP server auto-registered into Cursor/Claude Code |
| Self-Funding | Agent sells signals via b402, uses revenue for runtime costs |

### 9.2 Agentic Wallet Integration

| Skill | Used By | Purpose |
|-------|---------|---------|
| `binance-web3/get-quote` | Module 2 | Fetch cross-DEX quotes before execution |
| `binance-web3/swap` | Module 2 | Execute spot swaps for strategy actions |
| `binance-web3/get-balances` | Base Layer | Check portfolio state |
| `binance-web3/simulate-transaction` | Base Layer | Dry-run every trade |

### 9.3 b402 Monetization Flow

```
External Agent / User
    │
    ├── GET /api/alpha/signals
    │       │
    │       ▼
    │   HTTP 402 Payment Required
    │   { x402Version: 2, accepts: [{ scheme: "exact", amount: "10000", ... }] }
    │       │
    │       ▼
    │   Buyer signs EIP-3009 / Permit2 authorization
    │       │
    │       ▼
    │   Buyer retries with x402 payment payload
    │       │
    │       ▼
    │   Spectra Payment Gateway
    │       │
    │       ├── Mode A: POST /api/v2/b402/verify → POST /api/v2/b402/settle
    │       └── Mode B: Shadow Gateway (local EIP-712 verify → MockFacilitator.sol)
    │       │
    │       ▼
    │   Settlement confirmed → Deliver signal data
    │       │
    │       ▼
    │   Bazaar Extension metadata indexed for discovery
```

### 9.4 MCP Server

Spectra exposes an MCP server that is auto-registered via Agent Studio:

```typescript
const tools = [
  {
    name: "Spectra_get_signals",
    description: "Get all active Spectra signals",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "Spectra_get_oracle_divergence",
    description: "Get oracle divergence vs TradFi for a ticker",
    parameters: { ticker: { type: "string" } }
  },
  {
    name: "Spectra_get_weekend_premium",
    description: "Get weekend sentiment premium for a ticker",
    parameters: { ticker: { type: "string" } }
  },
  {
    name: "Spectra_execute_strategy",
    description: "Execute a strategy action via Agentic Wallet",
    parameters: { action: { type: "object" } }
  },
  {
    name: "Spectra_check_policy",
    description: "Check if an action passes PolicyVault constraints",
    parameters: { action: { type: "object" } }
  },
];
```

---

## 10. Smart Contract Layer

### 10.1 Contract Inventory

| Contract | Purpose | Feature Flag |
|----------|---------|--------------|
| `OracleWatch.sol` | Records historical spreads for off-chain analysis | Always |
| `PolicyVault.sol` | Stores execution constraints (max slip, limit) | Always |
| `ReceiptRegistry.sol` | Anchors agent decisions on-chain (SHA256) | Always |
| `StrategyRegistry.sol`| (Stretch) On-chain strategy DSL storage | `MODULE_2` |
| `FixedPointMath.sol` | Secure fixed-point arithmetic library | Always |
| `ExecutionPlan.sol` | EIP-712 signature verification for plans | Always |

### 10.2 OracleWatch.sol

Records `perSharePrice` and external TradFi price to permanently log the True Oracle Divergence. Emits `DivergenceRecorded`. Uses bounded arrays and timestamp tracking to prevent unbounded gas costs.

```solidity
// contracts/OracleWatch.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FixedPointMath.sol";

contract OracleWatch is Ownable {
    using FixedPointMath for uint256;

    event DivergenceRecorded(
        string indexed ticker,
        uint256 perSharePrice,
        uint256 tradfiPrice,
        uint256 timestamp,
        int256 divergenceBps
    );

    struct Snapshot {
        uint256 perSharePrice;
        uint256 tradfiPrice;
        uint256 timestamp;
        int256 divergenceBps;
    }

    mapping(string => Snapshot[]) private history;

    constructor() Ownable(msg.sender) {}

    function recordSnapshot(
        string calldata ticker,
        uint256 perSharePrice,
        uint256 tradfiPrice
    ) external onlyOwner {
        require(tradfiPrice > 0, "TradFi price zero");

        // Calculate divergence in bps using fixed-point math
        uint256 ratio = perSharePrice.mulFixed(FixedPointMath.BPS_PRECISION) / tradfiPrice;
        int256 divergenceBps = int256(ratio) - int256(FixedPointMath.BPS_PRECISION);

        history[ticker].push(Snapshot({
            perSharePrice: perSharePrice,
            tradfiPrice: tradfiPrice,
            timestamp: block.timestamp,
            divergenceBps: divergenceBps
        }));

        // Prevent unbounded array growth
        if (history[ticker].length > 1000) {
            _pruneHistory(ticker);
        }

        emit DivergenceRecorded(ticker, perSharePrice, tradfiPrice, block.timestamp, divergenceBps);
    }

    function _pruneHistory(string memory ticker) internal {
        uint256 length = history[ticker].length;
        uint256 trimSize = 500;
        for (uint256 i = 0; i < length - trimSize; i++) {
            history[ticker][i] = history[ticker][i + trimSize];
        }
        for (uint256 i = 0; i < trimSize; i++) {
            history[ticker].pop();
        }
    }

    function getHistory(string calldata ticker) external view returns (Snapshot[] memory) {
        return history[ticker];
    }
}
```

### 10.3 PolicyVault.sol

Stores maximum slippage and trade size limits per user, acting as an on-chain kill switch.

```solidity
// contracts/PolicyVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PolicyVault is Ownable {
    struct Policy {
        uint256 maxTradeNotionalUsd;
        uint256 maxSlippageBps;
        uint256 dailyLimitUsd;
        uint256 currentDailyUsageUsd;
        uint256 lastTradeTimestamp;
        bool killSwitch;
    }

    mapping(address => Policy) public policies;

    event PolicyUpdated(address indexed user);
    event KillSwitchToggled(address indexed user, bool active);

    constructor() Ownable(msg.sender) {}

    function setPolicy(
        address user,
        uint256 maxTrade,
        uint256 maxSlip,
        uint256 dailyLimit
    ) external onlyOwner {
        policies[user].maxTradeNotionalUsd = maxTrade;
        policies[user].maxSlippageBps = maxSlip;
        policies[user].dailyLimitUsd = dailyLimit;
        emit PolicyUpdated(user);
    }

    function checkTrade(address user, uint256 amountUsd, uint256 expectedSlippageBps) external view returns (bool, string memory) {
        Policy memory p = policies[user];
        if (p.killSwitch) return (false, "KILL_SWITCH_ACTIVE");
        if (amountUsd > p.maxTradeNotionalUsd) return (false, "MAX_TRADE_EXCEEDED");
        if (expectedSlippageBps > p.maxSlippageBps) return (false, "MAX_SLIPPAGE_EXCEEDED");

        // Basic daily limit reset logic
        if (block.timestamp > p.lastTradeTimestamp + 1 days) {
             if (amountUsd > p.dailyLimitUsd) return (false, "DAILY_LIMIT_EXCEEDED");
        } else {
             if (p.currentDailyUsageUsd + amountUsd > p.dailyLimitUsd) return (false, "DAILY_LIMIT_EXCEEDED");
        }
        return (true, "");
    }

    function toggleKillSwitch(address user, bool active) external onlyOwner {
        policies[user].killSwitch = active;
        emit KillSwitchToggled(user, active);
    }
}
```

### 10.4 ReceiptRegistry.sol

Anchors agent decisions. Includes exact hashes for simulation and API responses.

```solidity
// contracts/ReceiptRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReceiptRegistry is Ownable {
    struct Receipt {
        bytes32 decisionHash;
        bytes32 simulationHash;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 expectedAmountOut;
        uint256 actualAmountOut;
        string signalType;
        uint256 timestamp;
    }

    mapping(address => mapping(uint256 => Receipt)) public receipts;
    mapping(address => uint256) public receiptCounts;

    event ReceiptRecorded(
        address indexed user,
        uint256 indexed receiptId,
        bytes32 decisionHash
    );

    constructor() Ownable(msg.sender) {}

    function recordReceipt(
        address user,
        bytes32 decisionHash,
        bytes32 simulationHash,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 expectedAmountOut,
        uint256 actualAmountOut,
        string calldata signalType
    ) external onlyOwner {
        uint256 id = receiptCounts[user]++;
        receipts[user][id] = Receipt({
            decisionHash: decisionHash,
            simulationHash: simulationHash,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            expectedAmountOut: expectedAmountOut,
            actualAmountOut: actualAmountOut,
            signalType: signalType,
            timestamp: block.timestamp
        });

        emit ReceiptRecorded(user, id, decisionHash);
    }
}
```

### 10.5 StrategyRegistry.sol (Stretch)

```solidity
// contracts/StrategyRegistry.sol
// Stores the compiled Strategy DSL JSON on-chain. Not on the critical path.
```

### 10.6 Access Control Summary

Spectra contracts follow a strict centralized authorization model during the hackathon phase. Every contract inherits `Ownable` from OpenZeppelin.

- The `owner` is the Spectra Agent Backend.
- Only the backend can record oracle snapshots, update policies, and record receipts.
- End-users (wallet addresses) can read their policies but cannot write directly.
- This design simplifies the execution pipeline while maintaining the on-chain audit trail.
- Transitioning to decentralized control (e.g., users updating their own policies) is a post-hackathon roadmap item.

### 10.7 FixedPointMath.sol

Library for 18-decimal fixed-point arithmetic on-chain, matching the TypeScript implementation in the Base Layer.

```solidity
// contracts/FixedPointMath.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library FixedPointMath {
    uint256 constant PRECISION = 1e18;
    uint256 constant BPS_PRECISION = 10000;

    function mulFixed(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a * b) / PRECISION;
    }

    function divFixed(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "Division by zero");
        return (a * PRECISION) / b;
    }
}
```

### 10.8 EIP-712 Signed Execution Plans

To ensure agents execute exactly what the backend Coordinator finalized (e.g., after Strategy Conflict Resolution clips a trade size), Spectra uses EIP-712 structured signatures.

The Coordinator generates a finalized execution plan, hashes it, and signs it. The Agent submits this signature to the execution contract (if executing on-chain) or the backend verification endpoint.

```solidity
// contracts/ExecutionPlan.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ExecutionPlanVerifier is EIP712 {
    bytes32 private constant PLAN_TYPEHASH = keccak256("ExecutionPlan(address user,address targetToken,uint256 amountUsd,uint256 nonce,uint256 deadline)");
    address public backendSigner;

    constructor(address _signer) EIP712("Spectra", "1") {
        backendSigner = _signer;
    }

    function verifyPlan(
        address user,
        address targetToken,
        uint256 amountUsd,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) public view returns (bool) {
        require(block.timestamp <= deadline, "Plan expired");

        bytes32 structHash = keccak256(abi.encode(
            PLAN_TYPEHASH,
            user,
            targetToken,
            amountUsd,
            nonce,
            deadline
        ));

        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = ECDSA.recover(digest, signature);
        
        return recoveredSigner == backendSigner;
    }
}
```

---

## 11. Design System & UX

### 11.1 Color Palette

| Usage | Hex | Note |
|-------|-----|------|
| Background | `#0D0E12` | Deep space black |
| Panel | `#16181D` | Slightly elevated |
| Accent | `#F0B90B` | Binance Yellow |
| Open Market | `#0ECB81` | Vibrant green |
| Closed Market | `#787B86` | Dim gray |
| Alert | `#F6465D` | Critical red |
| On-chain Price | `#F0B90B` | Distinct from TradFi |
| TradFi Price | `#4A90E2` | Distinct from On-chain |

### 11.2 Typography

| Usage | Font |
|-------|------|
| Headers | `Inter`, Bold |
| Body | `Inter`, Regular |
| Data/Numbers | `JetBrains Mono` or `Roboto Mono` (tabular lining crucial) |
| Tickers | `Inter`, Semi-bold |

### 11.3 UI States

| State | Visual Treatment |
|-------|------------------|
| Open Market | Glowing green indicator, real-time pulse |
| Closed Market | Grey indicator, "Frozen" badge on prices |
| Stale Data | Strike-through on price, red warning badge |
| Halted | Large red "HALTED" overlay on ticker card |

### 11.4 Dashboard Layout

1. **Top Nav:** Market status, global search, wallet connect
2. **Left Sidebar:** Module switching (Intel, Forge, Flow), Settings
3. **Main Content:** Varies by module
4. **Bottom Bar:** Active signals ticker, last updated timestamp

### 11.5 Tech Stack (Frontend)

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Charts | Recharts / TradingView Lightweight Charts |
| Heatmap | D3.js (Treemap) |
| State | Zustand |
| Web3 | wagmi / viem |

---

## 12. Deployment Architecture

### 12.1 Environments

| Env | Domain | Purpose | Features Enabled |
|-----|--------|---------|------------------|
| Local | `localhost:3000` | Dev & Test | All, `yfinance` fallback |
| Vercel | `alpha-deck.vercel.app` | Hackathon Demo | All, Mock b402 |
| Prod | `app.Spectra.finance` | Post-hackathon | All, Official b402 |

### 12.2 Infrastructure

| Component | Provider |
|-----------|----------|
| Frontend | Vercel |
| Backend/API | Vercel Serverless Functions / Express on Railway |
| Database | Supabase (PostgreSQL) |
| Cache/PubSub | Upstash (Redis) |
| Agent Runtime | Hosted (Render/Railway) |
| RPC Nodes | BNB Chain Public Nodes |

---

## 13. Redundancy & Fault Tolerance

| Failure Point | Strategy |
|---------------|----------|
| Binance Web3 APIs down | Serve cached data with stale badge. Disable execution. |
| Finnhub down | Fallback to `yfinance`. If both down, suspend Oracle Divergence. |
| BscScan API down | Disable Module 3 (Flow Radar). Show warning. |
| RPC Node down | Fallback to secondary public endpoint. |
| DB Connection lost | Degraded mode: UI works off Redis cache. Write operations fail gracefully. |

---

## 14. Feasibility & Risk Matrix

| Risk | Impact | Mitigations |
|------|--------|-------------|
| **b402 SDK Issues** | Block paid features | Fallback to "shadow" gateway (mock facilitator). |
| **BscScan Rate Limits** | Module 3 breaks | Aggressive caching in Redis. Poll less frequently. |
| **Agent Execution Failure** | Trades fail | Comprehensive error handling in Wallet Skills. Detailed execution logs. |
| **UI Complexity** | Slow dev time | Pre-built templates over Visual Strategy Builder. shadcn/ui for fast styling. |

---

## 15. Estimated Budget

| Resource | Estimated Cost / Month |
|----------|------------------------|
| Vercel Pro | $20 |
| Supabase | $25 |
| Upstash | $10 |
| Render/Railway (Backend/Agents) | $20 |
| Finnhub Basic | $50 |
| RPC / BscScan APIs | Free tiers |
| **Total** | **~$125 / month** |

---

## 16. Build Timeline — 4.5 Weeks

### Phase 1: Base Layer (Weeks 1-2)
- Data Ingestion & Normalization (`tokenToShareRatio` logic)
- Signal Engine (Oracle Divergence, Weekend Premium, Cross-Platform)
- Redis Cache & Rate Limiting
- Basic b402 Gateway (Shadow mode first)
- Contracts: OracleWatch, PolicyVault

### Phase 2: Module 1 & Module 3 (Week 3)
- Module 1: Heatmap, Screener, Anomaly Filters
- Module 3: BscScan Integration, Flow Aggregation, Whale Tracking
- UI Polish for Intelligence Lenses

### Phase 3: Module 2 & Agent Layer (Weeks 4-4.5)
- Strategy Forge: NL Input, Templates, Simulator
- BNB Agent Studio Integration (ERC-8004)
- Agentic Wallet Integration (Wallet Skills)
- EIP-712 Execution Plans & Strategy Conflict Resolution
- Testing, Auditing, Documentation, Video Recording

---

## 17. Modular Strip-Out Plan

If time runs short before the hackathon deadline, Spectra is designed to fail gracefully by disabling modules via feature flags (`Config.ts`).

### Drop 1: Flow Radar (Module 3)
**If BscScan API integration is too complex:**
- Set `MODULE_3_FLOW_RADAR = false`
- **Impact:** Flow signals disappear. Screener removes "Net Flow" column. Strategy Forge disables `FLOW_ACCUMULATION_ABOVE` conditions.
- **Core value intact:** Market Intel (price anomalies) and Strategy execution still work perfectly.

### Drop 2: Visual Strategy Builder
**If building drag-and-drop UI takes too long:**
- Set `VISUAL_STRATEGY_BUILDER = false`
- **Impact:** The visual node editor is removed. Users build strategies using Natural Language (parsed by LLM) or by selecting Pre-built Templates.
- **Core value intact:** Automation and execution still function.

### Drop 3: Telegram Bot & Real-time WebSockets
**If push infrastructure is unstable:**
- Set `TELEGRAM_ALERTS = false`
- **Impact:** Users must keep the dashboard open to see alerts.
- **Core value intact:** The data pipeline and trading agents still run.

### Drop 4: EIP-712 Signed Plans
**If signing logic is too brittle for demo:**
- Disable `ExecutionPlanVerifier`. Agents execute based purely on API responses without cryptographic signatures.
- **Core value intact:** Agent autonomy is demonstrated, even if trust is slightly centralized.

**What Cannot Be Stripped:**
- The Base Layer Normalization Engine (`tokenToShareRatio`). Without this, the math is wrong.
- The Signal Engine.
- At least one intelligence lens (Module 1).
- At least one execution method (Module 2 Templates).

---

## 18. Final Deliverables

1. **Live Web Application:** Deployed on Vercel.
2. **GitHub Repository:** Clean, documented, MIT licensed.
3. **Smart Contracts:** Deployed on BSC Testnet (or Mainnet).
4. **Demo Video:** Showing the Unified Loop (Intel → Strategy → Execution).
5. **Pitch Deck / Write-up:** Highlighting the Empirical Foundation and architecture.

---

## 19. Judging Alignment

Spectra hits every major hackathon track requirement:

1. **Market Discovery:** Addressed by Module 1 (Heatmap, Anomaly Filters).
2. **Strategy Creation:** Addressed by Module 2 (Strategy Forge, NL Input).
3. **BNB Agent Studio Integration:** Addressed by the Agent Layer (autonomous execution).
4. **Agentic Wallet Utilization:** Addressed by Agent Wallet executing trades via Wallet Skills.
5. **b402 Monetization:** Addressed by the Payment Gateway (selling premium signals).

**Key Differentiators (The Nexus Edge):**
- **Empirical Accuracy:** We do not trade the `referencePrice` unit conversion spread.
- **Enterprise-Grade Execution:** Strategy Conflict Resolution prevents automated agents from fighting over capital, mirroring professional order routing.
- **Cryptographic Trust:** EIP-712 Signed Execution Plans cryptographically bind the agent's intent to the backend's finalized decision.
- **Missing Data as Product State:** The UI explicitly handles halted markets, missing feeds, and stale data gracefully rather than failing open.

---

## 20. DX Report Strategy

To satisfy the developer experience (DX) reporting requirement for b402, Agent Studio, and Agentic Wallet:

1. **Log Everything:** Maintain a raw markdown log of SDK errors, cryptic messages, and workarounds discovered during the build.
2. **Dedicated Readme Section:** Include a "Developer Experience Feedback" section in the root `README.md`.
3. **Actionable Suggestions:** Provide clear "Expected vs Actual" comparisons for each pain point.
4. **Submit with Project:** Ensure this feedback is prominently linked in the final submission.

---

## 21. Repository Structure

```
Spectra/
├── apps/
│   ├── web/                 # Next.js Dashboard (Modules 1, 2, 3 UI)
│   ├── backend/             # Express API, Base Layer Services
│   └── agent/               # Agent runtime, MCP Server
├── packages/
│   ├── core/                # Shared types, Normalization Engine math
│   ├── contracts/           # Solidity files + Hardhat/Foundry config
│   └── ui/                  # Shared React components (shadcn)
├── scripts/                 # Empirical testing scripts, deployment
└── docs/                    # Architecture, API specs, DX Report
```

---

## 22. Pre-Mainnet Verification Checklist

Before toggling `LIVE_TRADING = true` on BSC mainnet, these empirical checks must be re-run and documented:

- [ ] **Weekend/Halted Regime Test:** Run the empirical script at Saturday 14:00 UTC.
  - *Pass condition:* Determine if `referencePrice` freezes, how `marketStatus` updates, and what happens to DEX liquidity.
- [ ] **Dividend/Split Event Test:** Monitor `tokenToShareRatio` during a corporate action (if possible) or simulate the jump.
  - *Pass condition:* Normalization Engine must smoothly handle a discrete jump in the multiplier without triggering false arbitrage signals.
- [ ] **b402 Mainnet Key Rotation:** Verify production Secret Key is provisioned and never touches frontend code.
  - *Pass condition:* API endpoints return 402, accept valid x402 signatures, and settle on mainnet USDC.
- [ ] **PolicyVault Kill Switch Drill:** Execute the admin kill switch while the simulator is running.
  - *Pass condition:* All agent execution must halt within 1 block.

---
*End of Spectra Product Architecture Document*
```
