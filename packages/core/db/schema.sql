-- packages/core/db/schema.sql
-- PostgreSQL / Supabase Schema for Spectra Terminal
-- Reference: Spectra.md §4.1, §5.5, §8.2, §9.1

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Flow Events Table (§8.2) ──
-- Stores decoded BscScan ERC-20 transfer logs for tokenized equities
CREATE TABLE IF NOT EXISTS flow_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    ticker VARCHAR(16) NOT NULL,
    platform VARCHAR(16) NOT NULL, -- 'ONDO', 'BSTOCKS', 'XSTOCKS'
    contract_address VARCHAR(42) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount_shares NUMERIC(36, 18) NOT NULL, -- 18-decimal fixed-point shares
    amount_usd NUMERIC(36, 18) NOT NULL,    -- 18-decimal fixed-point USD value
    event_type VARCHAR(24) NOT NULL,        -- 'TRANSFER', 'BUY', 'SELL', 'MINT', 'BURN'
    is_whale BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_events_ticker_timestamp ON flow_events (ticker, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_flow_events_whale ON flow_events (is_whale, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_flow_events_from_address ON flow_events (from_address);
CREATE INDEX IF NOT EXISTS idx_flow_events_to_address ON flow_events (to_address);

-- ── 2. Execution Receipts Table (§5.5, §10.4) ──
-- Off-chain audit mirror of on-chain ReceiptRegistry.sol
CREATE TABLE IF NOT EXISTS execution_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    onchain_receipt_id BIGINT,
    decision_hash VARCHAR(66) NOT NULL,
    simulation_hash VARCHAR(66) NOT NULL,
    token_in VARCHAR(42) NOT NULL,
    token_out VARCHAR(42) NOT NULL,
    amount_in NUMERIC(36, 18) NOT NULL,
    expected_amount_out NUMERIC(36, 18) NOT NULL,
    actual_amount_out NUMERIC(36, 18) NOT NULL,
    signal_type VARCHAR(48) NOT NULL,
    status VARCHAR(24) NOT NULL, -- 'CONFIRMED', 'REVERTED', 'SIMULATED'
    tx_hash VARCHAR(66),
    block_number BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user ON execution_receipts (user_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_decision_hash ON execution_receipts (decision_hash);

-- ── 3. Registered Agents Table (§9.1) ──
-- Tracks autonomous agents registered via BNB Agent Studio (ERC-8004)
CREATE TABLE IF NOT EXISTS registered_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(64) UNIQUE NOT NULL, -- ERC-8004 identity URI / token ID
    name VARCHAR(128) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    strategy_id VARCHAR(64),
    status VARCHAR(24) DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'TERMINATED'
    total_trades INT DEFAULT 0,
    total_volume_usd NUMERIC(36, 18) DEFAULT 0,
    b402_revenue_usd NUMERIC(36, 18) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_owner ON registered_agents (owner_address);

-- ── 4. Price & Oracle Snapshots Table (§5.1, §10.2) ──
-- Tracks historical True Oracle Divergence snapshots
CREATE TABLE IF NOT EXISTS price_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker VARCHAR(16) NOT NULL,
    token_price NUMERIC(36, 18) NOT NULL,
    token_to_share_ratio NUMERIC(36, 18) NOT NULL,
    per_share_price NUMERIC(36, 18) NOT NULL,
    tradfi_price NUMERIC(36, 18) NOT NULL,
    oracle_divergence_bps BIGINT NOT NULL,
    market_status VARCHAR(16) NOT NULL, -- 'OPEN', 'CLOSED', 'HALTED'
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_ticker_time ON price_snapshots (ticker, timestamp DESC);
