# Components

Based on the architectural patterns, tech stack, and data models, I've identified the major logical components across the fullstack JarrBank application. These components define clear boundaries and interfaces between different parts of the system.

## RPC Batch Manager

**Responsibility:** Centralized management of all blockchain RPC calls with intelligent batching, caching, and failover to achieve the 10-second portfolio refresh requirement across 15+ positions

**Key Interfaces:**
- `batchCall(requests: RPCRequest[]): Promise<RPCResponse[]>` - Execute batched RPC requests
- `getCachedData(key: string): Promise<CachedData | null>` - Retrieve cached blockchain data
- `invalidateCache(pattern: string): Promise<void>` - Cache invalidation for real-time updates

**Dependencies:** Redis Cache, RPC Providers (Alchemy/Infura), Chain Configuration Service

**Technology Stack:** Node.js with Fastify, Redis for caching, exponential backoff retry logic, WebSocket connections for real-time data

## Portfolio Data Aggregator  

**Responsibility:** Orchestrates data collection from multiple chains and protocols to build comprehensive user portfolio views with accurate USD valuations

**Key Interfaces:**
- `aggregatePortfolio(userId: string, chains: number[]): Promise<Portfolio[]>` - Collect complete portfolio data
- `updatePortfolioHealth(portfolioId: string): Promise<HealthScore>` - Calculate and update health metrics
- `syncPortfolioData(portfolioId: string): Promise<SyncResult>` - Sync with blockchain state

**Dependencies:** RPC Batch Manager, Token Price Service, LP Position Tracker, Health Score Calculator

**Technology Stack:** tRPC procedures, PostgreSQL for persistence, TanStack Query for frontend caching, background job processing

## Workflow Automation Engine

**Responsibility:** Manages complex multi-step DeFi operations including cross-LP compounding, reward claiming, and transaction orchestration with 85% success rate requirement

**Key Interfaces:**
- `planWorkflow(params: WorkflowParams): Promise<WorkflowPlan>` - Create executable workflow plan
- `executeWorkflow(workflowId: string): Promise<ExecutionResult>` - Execute workflow steps
- `resumeWorkflow(workflowId: string, fromStep: number): Promise<ExecutionResult>` - Resume failed workflows

**Dependencies:** DEX Protocol Adapters, Transaction Simulator, Wallet Connector, Notification Service

**Technology Stack:** Event-driven architecture, PostgreSQL for state persistence, Redis for step coordination, Web3 transaction handling

## LP Position Tracker

**Responsibility:** Detailed tracking of liquidity provider positions across protocols with fee calculation, reward monitoring, and performance analytics

**Key Interfaces:**  
- `detectLPPositions(walletAddress: string, chainId: number): Promise<LPPosition[]>` - Identify all LP positions
- `calculatePositionPerformance(positionId: string): Promise<PerformanceMetrics>` - Performance and IL analysis
- `getClaimableRewards(positionIds: string[]): Promise<ClaimableReward[]>` - Identify claimable rewards

**Dependencies:** Protocol Adapters, RPC Batch Manager, Price Service, Performance Calculator

**Technology Stack:** Protocol-specific ABI integration, BigInt arithmetic for precision, caching layer for position data

## Health Score Calculator

**Responsibility:** Analyzes portfolio composition and generates health scores with actionable recommendations for risk management and optimization

**Key Interfaces:**
- `calculateHealthScore(portfolio: Portfolio): Promise<HealthAnalysis>` - Generate comprehensive health analysis
- `generateRecommendations(healthAnalysis: HealthAnalysis): Promise<Recommendation[]>` - Create actionable recommendations
- `updateHealthHistory(portfolioId: string, score: number): Promise<void>` - Track health trends

**Dependencies:** Portfolio Data Aggregator, Risk Assessment Engine, Recommendation Engine

**Technology Stack:** Statistical analysis algorithms, PostgreSQL for historical tracking, configurable scoring rules

## DEX Protocol Adapters

**Responsibility:** Standardized interfaces to multiple DEX protocols enabling uniform interaction across Uniswap, Trader Joe, Pharaoh, and Blackhole

**Key Interfaces:**
- `getPoolInfo(protocolId: string, poolAddress: string): Promise<PoolMetadata>` - Standard pool information
- `buildSwapTransaction(params: SwapParams): Promise<TransactionData>` - Generate swap transactions
- `buildLPTransaction(params: LPParams): Promise<TransactionData>` - Generate LP transactions

**Dependencies:** Protocol Contract ABIs, RPC Batch Manager, Transaction Builder

**Technology Stack:** VIEM for contract interactions, adapter pattern for protocol abstraction, TypeScript for type safety

## Dashboard Component System

**Responsibility:** Modular, customizable React components implementing the dashboard-centric navigation and responsive design from the UI/UX specification

**Key Interfaces:**
- `<PortfolioOverview />` - Main dashboard with health score and composition
- `<WorkflowWizard />` - Multi-step workflow execution interface  
- `<LPPositionTable />` - Sortable, filterable LP position management
- `<HealthAnalytics />` - Interactive health analysis and recommendations

**Dependencies:** tRPC Client, TanStack Query for state management, shadcn/ui components, Tailwind CSS

**Technology Stack:** Next.js 15 App Router, React Server Components, Progressive Web App capabilities, responsive design patterns

## Real-time Notification Service

**Responsibility:** Manages user notifications for portfolio health changes, workflow completions, and important DeFi events

**Key Interfaces:**
- `sendNotification(userId: string, notification: NotificationData): Promise<void>` - Send user notification
- `subscribeToUpdates(userId: string, preferences: NotificationPrefs): Promise<void>` - Manage subscriptions
- `broadcastHealthAlert(portfolioId: string, alert: HealthAlert): Promise<void>` - Health-based alerts

**Dependencies:** Supabase Real-time, Email Service, Push Notification Service, User Preferences

**Technology Stack:** Supabase real-time subscriptions, browser push APIs, email delivery service, WebSocket connections
