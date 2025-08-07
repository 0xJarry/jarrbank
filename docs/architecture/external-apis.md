# External APIs

Based on the PRD requirements and component design, JarrBank requires several external API integrations to provide comprehensive DeFi portfolio management and automation capabilities.

## Cost-Optimized Price Data Strategy

**Primary (Cost-Effective):** Moralis Web3 API
- **Cost:** $49/month for 25M requests
- **Pros:** Web3-native, excellent rate limits, multi-chain support
- **Cons:** Newer service, less historical data depth

**Secondary (Free Tier):** DefiLlama  
- **Cost:** Free
- **Pros:** DeFi-specialized, unlimited requests, excellent DeFi coverage
- **Cons:** No SLA, potential rate limiting during high usage

**Tertiary (Premium Fallback):** CoinMarketCap Basic
- **Cost:** $29/month for 10K daily requests
- **Pros:** Reliable, good price accuracy, reasonable cost
- **Cons:** Lower rate limits than Moralis

## Alchemy API

- **Purpose:** Primary RPC provider for Ethereum, Arbitrum, and Avalanche blockchain data with enhanced APIs
- **Documentation:** https://docs.alchemy.com/reference/api-overview
- **Base URL(s):** Chain-specific endpoints (eth-mainnet, arb-mainnet, etc.)
- **Authentication:** API Key in headers
- **Rate Limits:** 300 compute units/second (Growth tier)

**Key Endpoints Used:**
- `POST /v2/{api-key}` - Standard JSON-RPC methods (eth_call, eth_getBalance, etc.)
- `GET /v2/{api-key}/getTokenBalances` - Enhanced token balance queries
- `GET /v2/{api-key}/getTokenMetadata` - Token metadata lookup
- `POST /v2/{api-key}` - Batch RPC calls for portfolio efficiency
- `GET /v2/{api-key}/getAssetTransfers` - Transaction history for performance tracking

**Integration Notes:** Primary data source for blockchain state. Enhanced APIs reduce RPC call complexity. Webhook support for real-time transaction monitoring.

## Infura API

- **Purpose:** Fallback RPC provider ensuring 99.5% uptime requirement through provider redundancy
- **Documentation:** https://docs.infura.io/api
- **Base URL(s):** Chain-specific endpoints with project ID
- **Authentication:** Project ID and secret
- **Rate Limits:** 100,000 requests/day (Core tier)

**Integration Notes:** Automatic failover from Alchemy. Provides geographic redundancy and different infrastructure stack for reliability.

## Protocol-Specific APIs

**Uniswap Subgraph API**
- **Purpose:** Historical LP position data, pool analytics, and transaction history for Uniswap V2/V3 positions
- **Base URL(s):** https://api.thegraph.com/subgraphs/name/uniswap/
- **Authentication:** None (public subgraph)
- **Rate Limits:** 1000 queries/day (free tier)

**Trader Joe, Pharaoh, Blackhole APIs**
- **Status:** Documentation acquisition in progress
- **Priority:** High for Epic 3 completion (LP Position Tracking & Management)
- **Integration Notes:** May require direct contract interaction through RPC if APIs unavailable

## Error Handling & Fallback Strategy

**RPC Provider Fallback:**
1. Primary: Alchemy API with enhanced features
2. Secondary: Infura API for redundancy  
3. Tertiary: Additional providers as needed

**Price Data Fallback:**
1. Primary: Moralis for cost-effective production
2. Secondary: DefiLlama for DeFi-specific pricing and free fallback
3. Tertiary: CoinMarketCap Basic for reliable premium backup
