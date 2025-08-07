# Database Schema

Transforming the conceptual data models into concrete PostgreSQL schemas optimized for performance and scalability while maintaining data integrity for financial operations.

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For efficient text search

-- Users table with wallet connections
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_wallet_address TEXT NOT NULL,
    connected_wallets TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_primary_wallet CHECK (primary_wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_connected_wallets CHECK (
        array_length(connected_wallets, 1) IS NULL OR 
        connected_wallets <@ ARRAY(SELECT unnest(connected_wallets) WHERE unnest ~ '^0x[a-fA-F0-9]{40}$')
    )
);

-- User preferences for dashboard customization
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    dashboard_layout JSONB NOT NULL DEFAULT '[]',
    default_chains INTEGER[] NOT NULL DEFAULT '{1,42161,43114}',
    refresh_interval INTEGER NOT NULL DEFAULT 30, -- seconds
    notification_settings JSONB NOT NULL DEFAULT '{"email": true, "push": false, "health_alerts": true, "workflow_updates": true}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Portfolios per user per chain
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL,
    total_value_usd NUMERIC(78,18) NOT NULL DEFAULT 0, -- Support extreme values
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    last_synced_at TIMESTAMPTZ,
    composition JSONB NOT NULL DEFAULT '[]', -- AssetComposition array
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, chain_id)
);

-- Token metadata cache
CREATE TABLE token_metadata (
    address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decimals INTEGER NOT NULL CHECK (decimals >= 0 AND decimals <= 18),
    logo_uri TEXT,
    coingecko_id TEXT,
    category TEXT NOT NULL DEFAULT 'other' 
        CHECK (category IN ('blue-chip', 'defi', 'meme', 'stable', 'other')),
    price_decimals INTEGER NOT NULL DEFAULT 18,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (address, chain_id),
    CONSTRAINT valid_address CHECK (address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Token balances with precision handling
CREATE TABLE token_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    token_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    balance NUMERIC(78,0) NOT NULL, -- Raw token balance in smallest unit
    price_usd NUMERIC(36,18) NOT NULL, -- Price with 18 decimal precision
    value_usd NUMERIC(78,18) NOT NULL, -- Calculated USD value
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(portfolio_id, token_address),
    FOREIGN KEY (token_address, chain_id) REFERENCES token_metadata(address, chain_id)
);

-- Protocol definitions
CREATE TABLE protocols (
    id TEXT PRIMARY KEY, -- e.g., 'uniswap-v3'
    name TEXT NOT NULL,
    logo_uri TEXT,
    contract_addresses JSONB NOT NULL, -- Per-chain contract mapping
    supported_chains INTEGER[] NOT NULL,
    features JSONB NOT NULL DEFAULT '[]', -- ProtocolFeature array
    documentation JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LP positions with detailed tracking
CREATE TABLE lp_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    protocol_id TEXT NOT NULL REFERENCES protocols(id),
    pool_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    token_ids INTEGER[] DEFAULT '{}', -- For V3 NFT positions
    underlying_assets JSONB NOT NULL, -- UnderlyingAsset array
    total_value_usd NUMERIC(78,18) NOT NULL DEFAULT 0,
    accumulated_fees_usd NUMERIC(78,18) NOT NULL DEFAULT 0,
    claimable_rewards JSONB NOT NULL DEFAULT '[]', -- ClaimableReward array
    position_status TEXT NOT NULL DEFAULT 'active'
        CHECK (position_status IN ('active', 'out-of-range', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_pool_address CHECK (pool_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- LP position performance tracking
CREATE TABLE lp_position_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL REFERENCES lp_positions(id) ON DELETE CASCADE,
    total_return_usd NUMERIC(78,18) NOT NULL DEFAULT 0,
    impermanent_loss_usd NUMERIC(78,18) NOT NULL DEFAULT 0,
    apr NUMERIC(10,4), -- Annual percentage rate
    fee_apr NUMERIC(10,4), -- Fee-only APR
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure we don't have duplicate performance records for the same day
    UNIQUE(position_id, DATE(calculated_at))
);

-- Workflow execution tracking
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL
        CHECK (workflow_type IN ('cross-lp-compound', 'claim-rewards', 'rebalance')),
    status TEXT NOT NULL DEFAULT 'planning'
        CHECK (status IN ('planning', 'executing', 'completed', 'failed')),
    total_gas_cost_wei NUMERIC(78,0) DEFAULT 0,
    expected_outcome JSONB,
    actual_outcome JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Individual workflow steps
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_type TEXT NOT NULL
        CHECK (step_type IN ('claim', 'approve', 'swap', 'add-liquidity', 'remove-liquidity')),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
    transaction_hash TEXT,
    gas_used_wei NUMERIC(78,0),
    input_tokens JSONB NOT NULL DEFAULT '[]', -- TokenAmount array
    output_tokens JSONB NOT NULL DEFAULT '[]', -- TokenAmount array
    executed_at TIMESTAMPTZ,
    
    UNIQUE(workflow_id, step_number),
    CONSTRAINT valid_tx_hash CHECK (transaction_hash IS NULL OR transaction_hash ~ '^0x[a-fA-F0-9]{64}$')
);

-- Health score history for trend analysis
CREATE TABLE health_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    diversification_score INTEGER CHECK (diversification_score >= 0 AND diversification_score <= 100),
    concentration_score INTEGER CHECK (concentration_score >= 0 AND concentration_score <= 100),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    recommendations JSONB NOT NULL DEFAULT '[]',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_users_primary_wallet ON users(primary_wallet_address);
CREATE INDEX idx_users_connected_wallets ON users USING GIN(connected_wallets);
CREATE INDEX idx_users_last_active ON users(last_active_at);

CREATE INDEX idx_portfolios_user_chain ON portfolios(user_id, chain_id);
CREATE INDEX idx_portfolios_health_score ON portfolios(health_score);
CREATE INDEX idx_portfolios_last_synced ON portfolios(last_synced_at);

CREATE INDEX idx_token_balances_portfolio ON token_balances(portfolio_id);
CREATE INDEX idx_token_balances_token ON token_balances(token_address, chain_id);
CREATE INDEX idx_token_balances_value ON token_balances(value_usd);

CREATE INDEX idx_token_metadata_symbol ON token_metadata(symbol);
CREATE INDEX idx_token_metadata_category ON token_metadata(category);
CREATE INDEX idx_token_metadata_symbol_trgm ON token_metadata USING GIN(symbol gin_trgm_ops);

CREATE INDEX idx_lp_positions_portfolio ON lp_positions(portfolio_id);
CREATE INDEX idx_lp_positions_protocol ON lp_positions(protocol_id);
CREATE INDEX idx_lp_positions_status ON lp_positions(position_status);
CREATE INDEX idx_lp_positions_value ON lp_positions(total_value_usd);

CREATE INDEX idx_lp_performance_position ON lp_position_performance(position_id);
CREATE INDEX idx_lp_performance_calculated ON lp_position_performance(calculated_at);

CREATE INDEX idx_workflows_user ON workflow_executions(user_id);
CREATE INDEX idx_workflows_status ON workflow_executions(status);
CREATE INDEX idx_workflows_type ON workflow_executions(workflow_type);
CREATE INDEX idx_workflows_created ON workflow_executions(created_at);

CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX idx_workflow_steps_tx_hash ON workflow_steps(transaction_hash) WHERE transaction_hash IS NOT NULL;

CREATE INDEX idx_health_analytics_portfolio ON health_analytics(portfolio_id);
CREATE INDEX idx_health_analytics_calculated ON health_analytics(calculated_at);
CREATE INDEX idx_health_analytics_score ON health_analytics(health_score);

-- Views for common queries
CREATE VIEW portfolio_summary AS
SELECT 
    p.id,
    p.user_id,
    p.chain_id,
    p.total_value_usd,
    p.health_score,
    COUNT(tb.id) as token_count,
    COUNT(lp.id) as lp_position_count,
    p.last_synced_at
FROM portfolios p
LEFT JOIN token_balances tb ON p.id = tb.portfolio_id
LEFT JOIN lp_positions lp ON p.id = lp.portfolio_id
GROUP BY p.id;

CREATE VIEW user_portfolio_totals AS
SELECT 
    u.id as user_id,
    u.primary_wallet_address,
    SUM(p.total_value_usd) as total_portfolio_value_usd,
    AVG(p.health_score) as avg_health_score,
    COUNT(p.id) as portfolio_count,
    MAX(p.last_synced_at) as last_sync
FROM users u
JOIN portfolios p ON u.id = p.user_id
GROUP BY u.id, u.primary_wallet_address;
```
