import { Portfolio, TokenBalance, LPPosition } from './types'
import { parseEther } from 'viem'

const MOCK_TOKENS: Record<string, TokenBalance> = {
  ETH: {
    tokenAddress: '0x0000000000000000000000000000000000000000',
    balance: parseEther('2.5'),
    metadata: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoUrl: '/tokens/eth.png'
    },
    priceUSD: parseEther('2300'),
    valueUSD: parseEther('5750')
  },
  USDC: {
    tokenAddress: '0xA0b86a33E6441b8e6De0a29BADB1b48a46D4c4F7',
    balance: BigInt('10000000000'),
    metadata: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUrl: '/tokens/usdc.png'
    },
    priceUSD: parseEther('1'),
    valueUSD: parseEther('10000')
  },
  WBTC: {
    tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    balance: BigInt('50000000'),
    metadata: {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      logoUrl: '/tokens/wbtc.png'
    },
    priceUSD: parseEther('43000'),
    valueUSD: parseEther('21500')
  },
  ARB: {
    tokenAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    balance: parseEther('5000'),
    metadata: {
      symbol: 'ARB',
      name: 'Arbitrum',
      decimals: 18,
      logoUrl: '/tokens/arb.png'
    },
    priceUSD: parseEther('0.75'),
    valueUSD: parseEther('3750')
  },
  AVAX: {
    tokenAddress: '0x0000000000000000000000000000000000000000',
    balance: parseEther('150'),
    metadata: {
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18,
      logoUrl: '/tokens/avax.png'
    },
    priceUSD: parseEther('25'),
    valueUSD: parseEther('3750')
  }
}

const MOCK_LP_POSITIONS: LPPosition[] = [
  {
    protocolId: 'uniswap-v3',
    poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
    poolName: 'ETH/USDC 0.3%',
    underlyingAssets: [MOCK_TOKENS.ETH, MOCK_TOKENS.USDC],
    totalValueUSD: parseEther('8500'),
    apr: 12.5
  },
  {
    protocolId: 'curve',
    poolAddress: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
    poolName: 'stETH-ETH',
    underlyingAssets: [MOCK_TOKENS.ETH],
    totalValueUSD: parseEther('4200'),
    apr: 8.2
  },
  {
    protocolId: 'aave',
    poolAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    poolName: 'USDC Lending',
    underlyingAssets: [MOCK_TOKENS.USDC],
    totalValueUSD: parseEther('6000'),
    apr: 4.5
  }
]

export const generateMockPortfolio = (
  walletAddress: string, 
  chainId: number = 1
): Portfolio => {
  const addressSeed = parseInt(walletAddress.slice(2, 10), 16)
  const random = (seed: number) => ((seed * 9301 + 49297) % 233280) / 233280

  const baseTokens = Object.values(MOCK_TOKENS)
  const selectedTokens = baseTokens.filter((_, index) => 
    random(addressSeed + index) > 0.3
  ).map(token => ({
    ...token,
    balance: BigInt(Math.floor(Number(token.balance) * (0.5 + random(addressSeed + 100)))),
  }))

  const selectedLPs = MOCK_LP_POSITIONS.filter((_, index) => 
    random(addressSeed + index + 200) > 0.4
  ).map(lp => ({
    ...lp,
    totalValueUSD: BigInt(Math.floor(Number(lp.totalValueUSD) * (0.7 + random(addressSeed + 300))))
  }))

  const totalTokenValue = selectedTokens.reduce(
    (sum, token) => sum + token.valueUSD, 
    BigInt(0)
  )
  const totalLPValue = selectedLPs.reduce(
    (sum, lp) => sum + lp.totalValueUSD, 
    BigInt(0)
  )

  return {
    id: `portfolio-${walletAddress}-${chainId}`,
    userId: walletAddress,
    chainId,
    totalValue: totalTokenValue + totalLPValue,
    healthScore: Math.floor(75 + random(addressSeed + 500) * 20),
    composition: {
      tokens: selectedTokens,
      lpPositions: selectedLPs
    },
    lastUpdated: new Date()
  }
}

export const getChainSpecificTokens = (chainId: number) => {
  switch (chainId) {
    case 1: // Ethereum
      return [MOCK_TOKENS.ETH, MOCK_TOKENS.USDC, MOCK_TOKENS.WBTC]
    case 42161: // Arbitrum
      return [MOCK_TOKENS.ETH, MOCK_TOKENS.USDC, MOCK_TOKENS.ARB]
    case 43114: // Avalanche
      return [MOCK_TOKENS.AVAX, MOCK_TOKENS.USDC]
    default:
      return [MOCK_TOKENS.ETH, MOCK_TOKENS.USDC]
  }
}