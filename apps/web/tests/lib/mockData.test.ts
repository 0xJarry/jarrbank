import { describe, it, expect } from 'vitest'
import { generateMockPortfolio, getChainSpecificTokens } from '@/lib/mockData'
import { formatEther } from 'viem'

describe('mockData', () => {
  describe('generateMockPortfolio', () => {
    const testAddress = '0x1234567890123456789012345678901234567890'

    it('generates portfolio with correct basic structure', () => {
      const portfolio = generateMockPortfolio(testAddress, 1)

      expect(portfolio).toMatchObject({
        id: `portfolio-${testAddress}-1`,
        userId: testAddress,
        chainId: 1,
        totalValue: expect.any(BigInt),
        healthScore: expect.any(Number),
        composition: {
          tokens: expect.any(Array),
          lpPositions: expect.any(Array)
        },
        lastUpdated: expect.any(Date)
      })
    })

    it('generates consistent results for same address', () => {
      const portfolio1 = generateMockPortfolio(testAddress, 1)
      const portfolio2 = generateMockPortfolio(testAddress, 1)

      expect(portfolio1.id).toBe(portfolio2.id)
      expect(portfolio1.totalValue).toBe(portfolio2.totalValue)
      expect(portfolio1.healthScore).toBe(portfolio2.healthScore)
      expect(portfolio1.composition.tokens.length).toBe(portfolio2.composition.tokens.length)
    })

    it('generates different results for different addresses', () => {
      const address1 = '0x1234567890123456789012345678901234567890'
      const address2 = '0x0987654321098765432109876543210987654321'
      
      const portfolio1 = generateMockPortfolio(address1, 1)
      const portfolio2 = generateMockPortfolio(address2, 1)

      expect(portfolio1.id).not.toBe(portfolio2.id)
      // Values should be different (extremely unlikely to be same with seeded randomness)
      expect(portfolio1.totalValue).not.toBe(portfolio2.totalValue)
    })

    it('generates health score within valid range', () => {
      const portfolio = generateMockPortfolio(testAddress, 1)

      expect(portfolio.healthScore).toBeGreaterThanOrEqual(75)
      expect(portfolio.healthScore).toBeLessThanOrEqual(95)
    })

    it('ensures totalValue matches sum of token and LP values', () => {
      const portfolio = generateMockPortfolio(testAddress, 1)

      const tokenValue = portfolio.composition.tokens.reduce(
        (sum, token) => sum + token.valueUSD, 
        BigInt(0)
      )
      const lpValue = portfolio.composition.lpPositions.reduce(
        (sum, lp) => sum + lp.totalValueUSD, 
        BigInt(0)
      )

      expect(portfolio.totalValue).toBe(tokenValue + lpValue)
    })

    it('generates tokens with proper structure', () => {
      const portfolio = generateMockPortfolio(testAddress, 1)

      portfolio.composition.tokens.forEach(token => {
        expect(token).toMatchObject({
          tokenAddress: expect.any(String),
          balance: expect.any(BigInt),
          metadata: {
            symbol: expect.any(String),
            name: expect.any(String),
            decimals: expect.any(Number),
          },
          priceUSD: expect.any(BigInt),
          valueUSD: expect.any(BigInt)
        })
        
        expect(token.tokenAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
        expect(token.balance).toBeGreaterThan(BigInt(0))
        expect(token.priceUSD).toBeGreaterThan(BigInt(0))
        expect(token.valueUSD).toBeGreaterThan(BigInt(0))
      })
    })

    it('generates LP positions with proper structure', () => {
      const portfolio = generateMockPortfolio(testAddress, 1)

      portfolio.composition.lpPositions.forEach(lp => {
        expect(lp).toMatchObject({
          protocolId: expect.any(String),
          poolAddress: expect.any(String),
          underlyingAssets: expect.any(Array),
          totalValueUSD: expect.any(BigInt),
        })
        
        expect(lp.poolAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
        expect(lp.totalValueUSD).toBeGreaterThan(BigInt(0))
        if (lp.apr) {
          expect(lp.apr).toBeGreaterThan(0)
        }
      })
    })

    it('generates different portfolios for different chains', () => {
      const ethPortfolio = generateMockPortfolio(testAddress, 1)
      const arbPortfolio = generateMockPortfolio(testAddress, 42161)

      expect(ethPortfolio.chainId).toBe(1)
      expect(arbPortfolio.chainId).toBe(42161)
      expect(ethPortfolio.id).not.toBe(arbPortfolio.id)
    })
  })

  describe('getChainSpecificTokens', () => {
    it('returns Ethereum tokens for mainnet', () => {
      const tokens = getChainSpecificTokens(1)
      
      expect(tokens).toHaveLength(3)
      expect(tokens.some(t => t.metadata.symbol === 'ETH')).toBe(true)
      expect(tokens.some(t => t.metadata.symbol === 'USDC')).toBe(true)
      expect(tokens.some(t => t.metadata.symbol === 'WBTC')).toBe(true)
    })

    it('returns Arbitrum tokens for Arbitrum chain', () => {
      const tokens = getChainSpecificTokens(42161)
      
      expect(tokens).toHaveLength(3)
      expect(tokens.some(t => t.metadata.symbol === 'ETH')).toBe(true)
      expect(tokens.some(t => t.metadata.symbol === 'USDC')).toBe(true)
      expect(tokens.some(t => t.metadata.symbol === 'ARB')).toBe(true)
    })

    it('returns Avalanche tokens for Avalanche chain', () => {
      const tokens = getChainSpecificTokens(43114)
      
      expect(tokens).toHaveLength(2)
      expect(tokens.some(t => t.metadata.symbol === 'AVAX')).toBe(true)
      expect(tokens.some(t => t.metadata.symbol === 'USDC')).toBe(true)
    })

    it('returns default tokens for unknown chain', () => {
      const tokens = getChainSpecificTokens(999999)
      
      expect(tokens).toHaveLength(2)
      expect(tokens.some(t => t.metadata.symbol === 'ETH')).toBe(true)
      expect(tokens.some(t => t.metadata.symbol === 'USDC')).toBe(true)
    })
  })
})