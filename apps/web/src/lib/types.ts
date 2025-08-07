export interface TokenMetadata {
  symbol: string
  name: string
  decimals: number
  logoUrl?: string
}

export interface TokenBalance {
  tokenAddress: string
  balance: bigint
  metadata: TokenMetadata
  priceUSD: bigint
  valueUSD: bigint
}

export interface LPPosition {
  protocolId: string
  poolAddress: string
  underlyingAssets: TokenBalance[]
  totalValueUSD: bigint
  apr?: number
  poolName?: string
}

export interface Portfolio {
  id: string
  userId: string
  chainId: number
  totalValue: bigint
  healthScore: number
  composition: {
    tokens: TokenBalance[]
    lpPositions: LPPosition[]
  }
  lastUpdated: Date
}