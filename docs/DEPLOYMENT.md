# Spectra Deployment Guide

**Reference:** `Spectra.md` §12  
**Target Environments:** BSC Testnet (Chain ID 97) / BSC Mainnet (Chain ID 56), Vercel (Frontend), Railway/Render (Backend & Agents), Supabase (PostgreSQL), Upstash (Redis).

---

## 1. Environment Variables Reference

Create a `.env` file based on `.env.example`:

| Variable | Required | Default / Example | Purpose |
|----------|----------|-------------------|---------|
| `PORT` | No | `3001` | Backend HTTP & WebSocket port |
| `NODE_ENV` | Yes | `production` | Node environment |
| `BSC_TESTNET_RPC_URL` | Yes | `https://data-seed-prebsc-1-s1.binance.org:8545/` | BSC Testnet RPC endpoint |
| `BSC_MAINNET_RPC_URL` | No | `https://bsc-dataseed.binance.org/` | BSC Mainnet RPC endpoint |
| `DEPLOYER_PRIVATE_KEY` | Yes (for deploy) | `0x...` | Private key for contract deployment |
| `BSCSCAN_API_KEY` | Yes | `...` | BscScan API key for Flow Radar & verification |
| `B402_SECRET_KEY` | Yes | `...` | HMAC secret key for b402 signature verification |
| `B402_SHADOW_MODE` | No | `true` | Enables local shadow gateway fallback |
| `TELEGRAM_BOT_TOKEN` | No | `...` | grammY Telegram bot token |
| `DATABASE_URL` | Yes | `postgres://user:pass@host:5432/spectra` | Supabase PostgreSQL connection URI |
| `REDIS_URL` | Yes | `rediss://...` | Upstash Redis connection URI |
| `SIGNAL_WEEKEND_PREMIUM`| Yes | `false` | Feature flag (locked to false per empirical proof) |

---

## 2. Smart Contract Deployment (BSC Testnet)

Spectra contracts use Solidity `^0.8.24` targeting the Cancun EVM.

### Deploying to BSC Testnet (Chain 97):
```bash
# 1. Set environment variables
export BSC_TESTNET_RPC_URL="https://data-seed-prebsc-1-s1.binance.org:8545/"
export DEPLOYER_PRIVATE_KEY="0xYOUR_TESTNET_DEPLOYER_PRIVATE_KEY"

# 2. Compile and run the deployment script
npm run deploy:testnet -w @spectra/contracts
```

This deploys:
1. `FixedPointMath.sol` (Library)
2. `OracleWatch.sol`
3. `PolicyVault.sol`
4. `ReceiptRegistry.sol`
5. `ExecutionPlanVerifier.sol`
6. `MockFacilitator.sol`

Deployment addresses are automatically written to `packages/contracts/deployments/bscTestnet.json`.

### Verifying on BscScan:
```bash
CI=true npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 3. Database Setup (Supabase PostgreSQL)

1. Open your Supabase SQL Editor.
2. Execute the schema script located at:
   ```bash
   cat packages/core/db/schema.sql
   ```
3. Verify that the 4 tables (`flow_events`, `execution_receipts`, `registered_agents`, `price_snapshots`) and their indexes are created.

---

## 4. Backend & Agent Deployment (Railway / Render / Docker)

### Option A: Railway (Recommended)
1. Fork or push the Spectra repository to GitHub.
2. In Railway, click **New Project** → **Deploy from GitHub repo**.
3. Select the repository. Railway will detect `railway.json` and use the root `Dockerfile`.
4. Configure the environment variables in the Railway dashboard.
5. Service will build and expose port `3001` with healthcheck endpoint at `/health`.

### Option B: Render
1. In Render, select **Blueprints** → **New Blueprint Instance**.
2. Point to the repository. Render will automatically parse `render.yaml`.
3. Fill in the sensitive environment variables (`DEPLOYER_PRIVATE_KEY`, `B402_SECRET_KEY`).
4. Click **Apply**.

---

## 5. Frontend Deployment (Vercel)

1. Import the repository into Vercel.
2. In Project Settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
3. Add Environment Variables:
   - `NEXT_PUBLIC_BACKEND_URL`: URL of your deployed Railway/Render backend (e.g. `https://spectra-backend.railway.app`).
   - `NEXT_PUBLIC_WS_URL`: WebSocket URL (e.g. `wss://spectra-backend.railway.app`).
4. Deploy! Vercel will build and serve the App Router application on your production domain.

---

## 6. Post-Deployment Verification

1. **Verify Backend Health:**
   ```bash
   curl -I https://YOUR_BACKEND_URL/health
   # Expected: HTTP/1.1 200 OK
   ```
2. **Verify Paid Alpha Endpoint:**
   ```bash
   curl -I https://YOUR_BACKEND_URL/api/alpha/signals
   # Expected: HTTP/1.1 402 Payment Required
   ```
3. **Verify Unified Loop:**
   - Navigate to `https://YOUR_VERCEL_URL/loop`
   - Complete the 4-stage walkthrough (`SEE → READ → FORGE → PROVE`)
   - Confirm receipt anchoring reflects on-chain.
