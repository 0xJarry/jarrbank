import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Web3Provider } from '@/components/web3/Web3Provider'
import Home from '../../app/page'
import * as wagmi from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  createConfig: vi.fn(),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock TanStack React Query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock the mock data generator
vi.mock('@/lib/mockData', () => ({
  generateMockPortfolio: vi.fn().mockReturnValue({
    id: 'test-portfolio',
    userId: 'test-address',
    chainId: 1,
    totalValue: BigInt('0'),
    healthScore: 85,
    composition: {
      tokens: [],
      lpPositions: []
    },
    lastUpdated: new Date()
  }),
}))

const mockUseAccount = vi.mocked(wagmi.useAccount)
const mockUseChainId = vi.mocked(wagmi.useChainId)

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Web3Provider>
      {component}
    </Web3Provider>
  )
}

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    } as any)
    mockUseChainId.mockReturnValue(1)
  })

  it('renders the main heading', () => {
    renderWithProviders(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Welcome to JarrBank')
  })

  it('renders the description', () => {
    renderWithProviders(<Home />)
    
    const description = screen.getByText('Professional multi-chain DeFi portfolio management platform')
    expect(description).toBeInTheDocument()
  })

  it('renders all feature cards', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument()
    expect(screen.getByText('LP Tracking')).toBeInTheDocument()
    expect(screen.getByText('Multi-Chain')).toBeInTheDocument()
    expect(screen.getByText('Real-time Data')).toBeInTheDocument()
  })

  it('renders wallet connection component', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
  })

  it('has proper card descriptions', () => {
    renderWithProviders(<Home />)
    
    expect(screen.getByText('Advanced portfolio health analytics and insights')).toBeInTheDocument()
    expect(screen.getByText('Liquidity provider position tracking and management')).toBeInTheDocument()
    expect(screen.getByText('Track assets across Ethereum, Arbitrum, and Avalanche')).toBeInTheDocument()
    expect(screen.getByText('Live portfolio updates and price tracking')).toBeInTheDocument()
  })
})