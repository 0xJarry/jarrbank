import { ChainId } from '../constants/chains';

export enum AssetCategory {
  STABLECOIN = 'STABLECOIN',
  BLUECHIP = 'BLUECHIP',
  DEFI = 'DEFI',
  MEME = 'MEME',
  NFT = 'NFT',
  LIQUID_STAKING = 'LIQUID_STAKING',
  OTHER = 'OTHER'
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  coingeckoId?: string;
  chainId: ChainId;
  address: string;
}

export interface TokenBalance {
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

export interface AssetComposition {
  category: AssetCategory;
  percentage: number;
  valueUSD: bigint;
  tokenCount: number;
}

export interface LPPosition {
  id: string;
  portfolioId: string;
  protocol: string;
  poolAddress: string;
  token0: TokenMetadata;
  token1: TokenMetadata;
  amount0: bigint;
  amount1: bigint;
  lpTokenBalance: bigint;
  valueUSD: bigint;
  apy?: number;
  lastUpdatedAt: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  chainId: ChainId;
  totalValue: bigint;
  healthScore: number;
  lastSyncedAt: Date;
  composition: AssetComposition[];
  tokens: TokenBalance[];
  lpPositions: LPPosition[];
}

export interface PortfolioSummary {
  totalValueUSD: bigint;
  chainBreakdown: {
    chainId: ChainId;
    valueUSD: bigint;
    percentage: number;
  }[];
  topTokens: TokenBalance[];
  assetComposition: AssetComposition[];
}

export interface TokenPriceData {
  tokenAddress: string;
  chainId: ChainId;
  priceUSD: number;
  priceChangePercentage24h?: number;
  source: 'moralis' | 'defiLlama' | 'coinmarketcap' | 'coingecko';
  timestamp: Date;
}

export interface SyncResult {
  success: boolean;
  portfolioId: string;
  tokensUpdated: number;
  lpPositionsUpdated: number;
  errors?: string[];
  duration: number;
}