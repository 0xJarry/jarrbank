// Placeholder for DeFi utilities
export interface LiquidityPool {
  address: string;
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  chainId: number;
}

export function calculateImpermanentLoss(
  priceRatio: number
): number {
  return 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
}