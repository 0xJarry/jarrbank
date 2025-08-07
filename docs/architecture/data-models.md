# Data Models

Based on the PRD requirements and Epic analysis, I've identified the core business entities that will be shared between frontend and backend. These models form the foundation for both API contracts and database schemas.

## User

**Purpose:** Represents a DeFi user with wallet connections and preferences

**Key Attributes:**
- id: string - Unique user identifier
- walletAddress: string - Primary wallet address (checksummed)
- connectedWallets: string[] - Array of connected wallet addresses
- preferences: UserPreferences - Dashboard customization and settings
- createdAt: Date - Account creation timestamp
- lastActiveAt: Date - Last activity timestamp

### TypeScript Interface
```typescript
interface User {
  id: string;
  walletAddress: string;
  connectedWallets: string[];
  preferences: UserPreferences;
  createdAt: Date;
  lastActiveAt: Date;
}

interface UserPreferences {
  dashboardLayout: DashboardSection[];
  defaultChains: Chain[];
  refreshInterval: number;
  notificationSettings: NotificationPreferences;
}
```

### Relationships
- Has many Portfolio entities (one per chain)
- Has many WorkflowExecutions
- Has many LPPositions through Portfolio

## Portfolio

**Purpose:** Aggregated view of user's assets and positions across a specific chain

**Key Attributes:**
- id: string - Unique portfolio identifier
- userId: string - Reference to owning user
- chainId: number - Blockchain network identifier
- totalValue: bigint - Total portfolio value in wei (USD)
- healthScore: number - Calculated health score (0-100)
- lastSyncedAt: Date - Last successful data synchronization
- composition: AssetComposition[] - Asset breakdown by category

### TypeScript Interface
```typescript
interface Portfolio {
  id: string;
  userId: string;
  chainId: number;
  totalValue: bigint;
  healthScore: number;
  lastSyncedAt: Date;
  composition: AssetComposition[];
  tokens: TokenBalance[];
  lpPositions: LPPosition[];
}

interface AssetComposition {
  category: 'blue-chip' | 'defi' | 'meme' | 'stable' | 'other';
  valueUSD: bigint;
  percentage: number;
}
```

### Relationships
- Belongs to User
- Has many TokenBalances
- Has many LPPositions
- Has many HealthAnalytics records

## TokenBalance

**Purpose:** Individual token holdings with metadata and valuation

**Key Attributes:**
- id: string - Unique balance identifier
- portfolioId: string - Reference to parent portfolio
- tokenAddress: string - Contract address of the token
- balance: bigint - Token balance in smallest unit
- metadata: TokenMetadata - Token name, symbol, decimals, logo
- priceUSD: bigint - Current price in USD (wei precision)
- valueUSD: bigint - Total value (balance * price)

### TypeScript Interface
```typescript
interface TokenBalance {
  id: string;
  portfolioId: string;
  tokenAddress: string;
  balance: bigint;
  metadata: TokenMetadata;
  priceUSD: bigint;
  valueUSD: bigint;
  category: AssetCategory;
  lastUpdatedAt: Date;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  coingeckoId?: string;
}
```

### Relationships
- Belongs to Portfolio
- Referenced in WorkflowSteps

## LPPosition

**Purpose:** Liquidity provider positions with detailed tracking and analytics

**Key Attributes:**
- id: string - Unique position identifier
- portfolioId: string - Reference to parent portfolio
- protocolId: string - DEX protocol identifier
- poolAddress: string - LP pool contract address
- tokenIds: number[] - Position token IDs (for V3 positions)
- underlyingAssets: UnderlyingAsset[] - Breakdown of underlying tokens
- accumulatedFees: bigint - Total fees earned in USD
- claimableRewards: ClaimableReward[] - Pending reward tokens
- performance: PositionPerformance - Performance analytics

### TypeScript Interface
```typescript
interface LPPosition {
  id: string;
  portfolioId: string;
  protocolId: string;
  poolAddress: string;
  tokenIds: number[];
  underlyingAssets: UnderlyingAsset[];
  totalValueUSD: bigint;
  accumulatedFees: bigint;
  claimableRewards: ClaimableReward[];
  performance: PositionPerformance;
  status: 'active' | 'out-of-range' | 'closed';
  createdAt: Date;
  lastUpdatedAt: Date;
}

interface UnderlyingAsset {
  tokenAddress: string;
  amount: bigint;
  valueUSD: bigint;
  percentage: number;
}

interface ClaimableReward {
  tokenAddress: string;
  amount: bigint;
  valueUSD: bigint;
  claimMethod: string; // Contract method to claim
}

interface PositionPerformance {
  totalReturn: bigint;
  impermanentLoss: bigint;
  apr: number;
  feeAPR: number;
}
```

### Relationships
- Belongs to Portfolio
- Referenced in WorkflowExecutions
- Has many PerformanceSnapshots

## WorkflowExecution

**Purpose:** Tracks complex multi-step DeFi operations and their execution status

**Key Attributes:**
- id: string - Unique execution identifier
- userId: string - User who initiated the workflow
- type: 'cross-lp-compound' | 'claim-rewards' | 'rebalance' - Workflow type
- status: 'planning' | 'executing' | 'completed' | 'failed' - Current status
- steps: WorkflowStep[] - Individual steps in the workflow
- totalGasCost: bigint - Total gas consumed
- expectedOutcome: WorkflowOutcome - Predicted results
- actualOutcome: WorkflowOutcome - Actual results

### TypeScript Interface
```typescript
interface WorkflowExecution {
  id: string;
  userId: string;
  type: WorkflowType;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  totalGasCost: bigint;
  expectedOutcome: WorkflowOutcome;
  actualOutcome?: WorkflowOutcome;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

interface WorkflowStep {
  id: string;
  stepNumber: number;
  type: 'claim' | 'swap' | 'add-liquidity' | 'approve';
  status: 'pending' | 'executing' | 'completed' | 'failed';
  transactionHash?: string;
  gasUsed?: bigint;
  inputTokens: TokenAmount[];
  outputTokens: TokenAmount[];
  executedAt?: Date;
}

interface WorkflowOutcome {
  portfolioValueChange: bigint;
  newLPPositions: string[];
  claimedRewards: TokenAmount[];
  swapResults: SwapResult[];
}
```

### Relationships
- Belongs to User
- References LPPositions and TokenBalances
- Has many TransactionRecords

## Protocol

**Purpose:** DEX protocol definitions and integration metadata

**Key Attributes:**
- id: string - Protocol identifier (e.g., 'uniswap-v3')
- name: string - Display name
- contractAddresses: Record<number, ProtocolContracts> - Contracts per chain
- supportedChains: number[] - Supported chain IDs
- features: ProtocolFeature[] - Supported features
- documentation: ProtocolDocs - Integration documentation

### TypeScript Interface
```typescript
interface Protocol {
  id: string;
  name: string;
  logoURI: string;
  contractAddresses: Record<number, ProtocolContracts>;
  supportedChains: number[];
  features: ProtocolFeature[];
  documentation: ProtocolDocs;
  isActive: boolean;
}

interface ProtocolContracts {
  router: string;
  factory: string;
  multicall?: string;
  masterChef?: string; // For rewards
}

interface ProtocolFeature {
  type: 'v2-lp' | 'v3-lp' | 'farming' | 'staking';
  enabled: boolean;
  configuration: Record<string, any>;
}
```

### Relationships
- Referenced by LPPositions
- Used in WorkflowExecutions
