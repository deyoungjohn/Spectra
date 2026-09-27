# Spectra Demo Video Walkthrough Script

**Duration:** ~3–4 minutes  
**Goal:** Present the empirical discovery, modules, autonomous agent execution, and the Unified Loop (`SEE → READ → FORGE → PROVE`) to hackathon judges.

---

## ⏱️ Video Breakdown

| Scene | Duration | Screen Focus | Key Narrative |
|-------|----------|--------------|---------------|
| **0:00 – 0:40** | 40s | Slides & Code Snippet | **The Hook: The $100M Arbitrage Illusion** |
| **0:40 – 1:20** | 40s | `/` Market Intel Dashboard | **SEE: Real-Time Intelligence & Anomaly Spotter** |
| **1:20 – 1:55** | 35s | `/flow` Flow Radar | **READ: Smart Money & Whale Accumulation Radar** |
| **1:55 – 2:45** | 50s | `/forge` & `/loop` | **FORGE: Natural Language Strategy & Dry-Run Simulation** |
| **2:45 – 3:30** | 45s | Agent Studio, MCP & ReceiptRegistry | **PROVE: b402 Monetization & On-Chain Audit Proof** |

---

## 🎬 Detailed Script & Action Cue

### Act 1: The Empirical Foundation (0:00 – 0:40)
- **Visual:** Display `Spectra.md` §2 table and the unit-conversion proof formula:
  $$\text{Residual} = \left| \text{referencePrice} - \frac{\text{tokenPrice}}{\text{tokenToShareRatio}} \right| < 4.81 \times 10^{-19}$$
- **Speaker:**
  > *"Welcome to Spectra. Before writing a single line of frontend code or automated strategy, we ran 19 empirical polls against the RWA tokenized equity feeds on BNB Smart Chain.*
  >
  > *What we discovered changes everything: the on-chain `referencePrice` is NOT an independent TradFi oracle. It is a deterministic, mathematical unit conversion of `tokenPrice` divided by `tokenToShareRatio`.*
  >
  > *Bots trying to trade that 33 basis point spread are losing money on gas and fees. Spectra is built on mathematical truth: we normalize everything to true per-share prices, cross-check against independent TradFi anchors, and execute verifiable agentic strategies."*

---

### Act 2: SEE — Market Intelligence (0:40 – 1:20)
- **Visual:** Navigate to `http://localhost:3000/`.
  - Toggle between Heatmap Treemap and Screener Table.
  - Click the **"Oracle Divergence"** anomaly filter chip.
  - Hover over **TSLA (+105 bps)** and click on **NVDA (38 bps Cross-Platform Basis)**.
- **Speaker:**
  > *"Step 1 of our Unified Loop is SEE. Here on the Market Intelligence dashboard, every tokenized stock across Ondo, bStocks, and xStocks is converted into its true per-share price.*
  >
  > *Notice the visual states: when US markets close, prices freeze gracefully with explicit badges rather than hallucinating freshness. With our Web3 anomaly filters, we immediately spot that TSLA is trading at a 105 bps premium vs TradFi, and bStocks NVDA is 38 bps cheaper than Ondo NVDA.*
  >
  > *From here, we can drill directly into the asset."*

---

### Act 3: READ — Flow Radar (1:20 – 1:55)
- **Visual:** Navigate to `http://localhost:3000/flow`.
  - Show the 24h Net Flow Leaderboard.
  - Show the **Whale Movements Table** with verified BSC transaction links.
  - Highlight the pre-event accumulation alert: *"3 BSC whale wallets accumulated $125k of Ondo AAPL in the last 4 hours before US market open."*
- **Speaker:**
  > *"Price anomalies alone aren't enough—you need to know if smart money is moving. That brings us to Step 2: READ.*
  >
  > *Flow Radar indexes BscScan ERC-20 transfer logs in real time. We see three large BSC wallets aggressively accumulating Ondo AAPL four hours ahead of the opening bell.*
  >
  > *Now we have an empirically backed thesis: a pricing discrepancy confirmed by on-chain whale accumulation."*

---

### Act 4: FORGE — Strategy Synthesis & Dry-Run (1:55 – 2:45)
- **Visual:** Navigate to `http://localhost:3000/loop` (or `/forge`).
  - Demonstrate the Natural Language composer with preset chip:
    `"Rotate Ondo AAPL to bStocks when basis > 20 bps and Flow > $5,000"`.
  - Click **"Compile Strategy"** → View the compiled typed Strategy DSL JSON.
  - Click **"⚡ Execute Dry-Run Simulation"**.
  - Show the calculated financial output: Simulated Price `$334.60`, Slippage `15 bps`, DEX Fee `$0.03`, Net Output `$9.97`, and cryptographic `simulationHash`.
- **Speaker:**
  > *"In Step 3: FORGE, we turn this thesis into executable code without writing Solidity.*
  >
  > *Using our Natural Language composer, we specify our condition: rotate when basis exceeds 20 bps and Flow Radar confirms net accumulation above $5,000.*
  >
  > *Our compiler validates the rule against PolicyVault constraints—capping trade size and slippage. Before any transaction touches the mempool, our simulator runs a dry-run against Base Layer fixed-point arithmetic and generates a deterministic SHA-256 simulation hash."*

---

### Act 5: PROVE — Agent Layer, b402 & On-Chain Audit (2:45 – 3:30)
- **Visual:** Complete Stage 4 on `/loop`.
  - Click **"Anchor Proof on ReceiptRegistry.sol"**.
  - Show the on-chain receipt with `decisionHash`, `simulationHash`, and BSC Testnet contract address.
  - Terminal overlay: Show `SpectraMcpServer` responding to Claude Code / Agent Studio and b402 paid alpha endpoint returning HTTP 402 → settlement.
- **Speaker:**
  > *"Finally, Step 4: PROVE.*
  >
  > *Autonomous execution without proof is a black box. Spectra immutably anchors every agent decision, simulation hash, and swap parameter to `ReceiptRegistry.sol` on BNB Smart Chain. Anyone can verify the agent's historical track record on BscScan.*
  >
  > *Furthermore, Spectra agents are self-funding: they sell proprietary alpha feeds via b402 micro-payments to other agents, and register ERC-8004 identities via BNB Agent Studio.*
  >
  > *Spectra: Empirically grounded intelligence, autonomous agent execution, and cryptographic auditability for tokenized equities on BNB Chain. Thank you."*
