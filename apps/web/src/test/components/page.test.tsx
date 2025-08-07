import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Web3Provider } from '@/components/web3/Web3Provider'
import Home from '../../app/page'
import * as wagmi from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    useAccount: vi.fn(),
    useChainId: vi.fn(),
    useConnect: vi.fn(),
    useDisconnect: vi.fn(),
    useSwitchChain: vi.fn(),
    useEnsName: vi.fn(),
    WagmiProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

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
const mockUseConnect = vi.mocked(wagmi.useConnect)
const mockUseDisconnect = vi.mocked(wagmi.useDisconnect)
const mockUseSwitchChain = vi.mocked(wagmi.useSwitchChain)
const mockUseEnsName = vi.mocked(wagmi.useEnsName)

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
    mockUseConnect.mockReturnValue({
      connect: vi.fn(),
      connectors: [],
      isPending: false,
      error: null,
    } as any)
    mockUseDisconnect.mockReturnValue({
      disconnect: vi.fn(),
      isPending: false,
    } as any)
    mockUseSwitchChain.mockReturnValue({
      switchChain: vi.fn(),
      isPending: false,
      error: null,
    } as any)
    mockUseEnsName.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any)
  })

  it('renders without crashing and shows main content', () => {
    renderWithProviders(<Home />)
    
    // Just test that key elements exist - use getAllByText for elements that appear multiple times
    expect(screen.getAllByText('JarrBank').length).toBeGreaterThan(0)
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
  })
})