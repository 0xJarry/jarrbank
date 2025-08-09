import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortfolioOverview } from '@/components/portfolio/PortfolioOverview'
import * as wagmi from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
}))

// Mock tRPC hooks used by the component
const useQueryMock = vi.fn()
const useMutationMock = vi.fn()
vi.mock('@/lib/trpc', () => ({
  trpc: {
    portfolio: {
      getPortfolioSummary: { useQuery: (...args: any[]) => useQueryMock(...args) },
      refreshPortfolio: { useMutation: (...args: any[]) => useMutationMock(...args) },
    },
  },
}))

const mockUseAccount = vi.mocked(wagmi.useAccount)
const mockUseChainId = vi.mocked(wagmi.useChainId)

describe('PortfolioOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mutation mock
    useMutationMock.mockReturnValue({ mutate: vi.fn() })
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
      useQueryMock.mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: vi.fn() })
      render(<PortfolioOverview />)
      expect(screen.getByText('Portfolio Overview')).toBeInTheDocument()
      expect(screen.getByText('Connect your wallet to view your portfolio')).toBeInTheDocument()
    })
  })

  describe('when wallet is connected', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'

    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(1)
    })

    const makeSummary = (overrides: Partial<any> = {}) => ({
      totalValueUSD: '4500000', // $45,000.00 in cents
      chainBreakdown: [
        { chainId: 1, percentage: 66.67, valueUSD: '3000000' },
        { chainId: 42161, percentage: 33.33, valueUSD: '1500000' },
      ],
      topTokens: [
        {
          id: 'p-eth',
          portfolioId: 'p1',
          tokenAddress: '0x0000000000000000000000000000000000000000',
          balance: '2500000000000000000',
          metadata: { symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 1, address: '0x0' },
          priceUSD: '230000',
          valueUSD: '575000',
          category: 'BLUECHIP',
          lastUpdatedAt: new Date().toISOString(),
        },
        {
          id: 'p-usdc',
          portfolioId: 'p1',
          tokenAddress: '0xa0b8...',
          balance: '10000000000',
          metadata: { symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 1, address: '0xa0b8' },
          priceUSD: '100',
          valueUSD: '1000000',
          category: 'STABLECOIN',
          lastUpdatedAt: new Date().toISOString(),
        },
      ],
      assetComposition: [
        { category: 'STABLECOIN', percentage: 22.2, valueUSD: '1000000', tokenCount: 1 },
        { category: 'BLUECHIP', percentage: 12.8, valueUSD: '575000', tokenCount: 1 },
      ],
      ...overrides,
    })

    it('renders portfolio summary cards', () => {
      useQueryMock.mockReturnValue({ data: makeSummary(), isLoading: false, error: null, refetch: vi.fn() })
      render(<PortfolioOverview />)
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument()
      expect(screen.getByText('Health Score')).toBeInTheDocument()
      expect(screen.getByText('Active Positions')).toBeInTheDocument()
    })

    it('displays formatted total portfolio value', () => {
      useQueryMock.mockReturnValue({ data: makeSummary(), isLoading: false, error: null, refetch: vi.fn() })
      render(<PortfolioOverview />)
      // Component uses compact formatting (K/M/B) for large values
      expect(screen.getByText('$45.00K')).toBeInTheDocument()
    })

    it('displays health score with status', () => {
      useQueryMock.mockReturnValue({ data: makeSummary(), isLoading: false, error: null, refetch: vi.fn() })
      render(<PortfolioOverview />)
      expect(screen.getByText(/\/100$/)).toBeInTheDocument()
      expect(screen.getByText(/Excellent|Good|Needs Attention/)).toBeInTheDocument()
    })

    it('shows correct position counts', () => {
      useQueryMock.mockReturnValue({ data: makeSummary(), isLoading: false, error: null, refetch: vi.fn() })
      render(<PortfolioOverview />)
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('2 tokens across chains')).toBeInTheDocument()
    })

    it('renders chain distribution list', () => {
      useQueryMock.mockReturnValue({ data: makeSummary(), isLoading: false, error: null, refetch: vi.fn() })
      render(<PortfolioOverview />)
      expect(screen.getByText('Chain Distribution')).toBeInTheDocument()
    })
  })
})