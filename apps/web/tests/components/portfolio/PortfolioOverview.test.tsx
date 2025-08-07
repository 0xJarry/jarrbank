import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortfolioOverview } from '@/components/portfolio/PortfolioOverview'
import * as wagmi from 'wagmi'
import { generateMockPortfolio } from '@/lib/mockData'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
}))

// Mock the mock data generator
vi.mock('@/lib/mockData', () => ({
  generateMockPortfolio: vi.fn(),
}))

const mockUseAccount = vi.mocked(wagmi.useAccount)
const mockUseChainId = vi.mocked(wagmi.useChainId)
const mockGenerateMockPortfolio = vi.mocked(generateMockPortfolio)

describe('PortfolioOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when wallet is not connected', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any)
      mockUseChainId.mockReturnValue(1)
    })

    it('renders disconnected state', () => {
      render(<PortfolioOverview />)
      
      expect(screen.getByText('Portfolio Overview')).toBeInTheDocument()
      expect(screen.getByText('Connect your wallet to view your portfolio')).toBeInTheDocument()
    })
  })

  describe('when wallet is connected', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'
    const mockPortfolio = {
      id: 'test-portfolio',
      userId: mockAddress,
      chainId: 1,
      totalValue: BigInt('45000000000000000000000'), // $45,000 in wei
      healthScore: 85,
      composition: {
        tokens: [
          {
            tokenAddress: '0x0000000000000000000000000000000000000000',
            balance: BigInt('2500000000000000000'), // 2.5 ETH
            metadata: {
              symbol: 'ETH',
              name: 'Ethereum',
              decimals: 18,
              logoUrl: '/tokens/eth.png'
            },
            priceUSD: BigInt('2300000000000000000000'), // $2300
            valueUSD: BigInt('5750000000000000000000') // $5750
          },
          {
            tokenAddress: '0xA0b86a33E6441b8e6De0a29BADB1b48a46D4c4F7',
            balance: BigInt('10000000000'), // 10,000 USDC
            metadata: {
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
              logoUrl: '/tokens/usdc.png'
            },
            priceUSD: BigInt('1000000000000000000'), // $1
            valueUSD: BigInt('10000000000000000000000') // $10,000
          }
        ],
        lpPositions: [
          {
            protocolId: 'uniswap-v3',
            poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8',
            poolName: 'ETH/USDC 0.3%',
            underlyingAssets: [],
            totalValueUSD: BigInt('8500000000000000000000'), // $8,500
            apr: 12.5
          }
        ]
      },
      lastUpdated: new Date()
    }

    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(1)
      mockGenerateMockPortfolio.mockReturnValue(mockPortfolio)
    })

    it('renders portfolio summary cards', () => {
      render(<PortfolioOverview />)
      
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument()
      expect(screen.getByText('Health Score')).toBeInTheDocument()
      expect(screen.getByText('Active Positions')).toBeInTheDocument()
    })

    it('displays formatted total portfolio value', () => {
      render(<PortfolioOverview />)
      
      expect(screen.getByText('$45,000.00')).toBeInTheDocument()
    })

    it('displays health score with status', () => {
      render(<PortfolioOverview />)
      
      expect(screen.getByText('85/100')).toBeInTheDocument()
      expect(screen.getByText('Excellent')).toBeInTheDocument()
    })

    it('shows correct position counts', () => {
      render(<PortfolioOverview />)
      
      expect(screen.getByText('3')).toBeInTheDocument() // 2 tokens + 1 LP
      expect(screen.getByText('2 tokens, 1 LP positions')).toBeInTheDocument()
    })

    it('displays token holdings with correct formatting', () => {
      render(<PortfolioOverview />)
      
      expect(screen.getByText('Token Holdings')).toBeInTheDocument()
      expect(screen.getByText('ETH')).toBeInTheDocument()
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
      expect(screen.getByText('2.5000 ETH')).toBeInTheDocument()
      expect(screen.getByText('$5,750.00')).toBeInTheDocument()
      
      expect(screen.getByText('USDC')).toBeInTheDocument()
      expect(screen.getByText('USD Coin')).toBeInTheDocument()
      expect(screen.getByText('$10,000.00')).toBeInTheDocument()
    })

    it('displays LP positions when available', () => {
      render(<PortfolioOverview />)
      
      expect(screen.getByText('Liquidity Pool Positions')).toBeInTheDocument()
      expect(screen.getByText('ETH/USDC 0.3%')).toBeInTheDocument()
      expect(screen.getByText('uniswap-v3')).toBeInTheDocument()
      expect(screen.getByText('$8,500.00')).toBeInTheDocument()
      expect(screen.getByText('12.5% APR')).toBeInTheDocument()
    })

    it('generates portfolio with correct parameters', () => {
      render(<PortfolioOverview />)
      
      expect(mockGenerateMockPortfolio).toHaveBeenCalledWith(mockAddress, 1)
    })

    it('displays health score status correctly for different ranges', () => {
      // Test Good health score
      mockGenerateMockPortfolio.mockReturnValue({
        ...mockPortfolio,
        healthScore: 70
      })

      const { rerender } = render(<PortfolioOverview />)
      expect(screen.getByText('70/100')).toBeInTheDocument()
      expect(screen.getByText('Good')).toBeInTheDocument()

      // Test Needs Attention health score
      mockGenerateMockPortfolio.mockReturnValue({
        ...mockPortfolio,
        healthScore: 45
      })

      rerender(<PortfolioOverview />)
      expect(screen.getByText('45/100')).toBeInTheDocument()
      expect(screen.getByText('Needs Attention')).toBeInTheDocument()
    })
  })
})