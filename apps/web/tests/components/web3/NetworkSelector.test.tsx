import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NetworkSelector } from '@/components/web3/NetworkSelector'
import * as wagmi from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useSwitchChain: vi.fn(),
}))

// Mock the wagmi config
vi.mock('@/lib/wagmi', () => ({
  supportedChains: [
    { id: 1, name: 'Ethereum' },
    { id: 42161, name: 'Arbitrum' },
    { id: 43114, name: 'Avalanche' },
  ],
}))

const mockUseAccount = vi.mocked(wagmi.useAccount)
const mockUseChainId = vi.mocked(wagmi.useChainId)
const mockUseSwitchChain = vi.mocked(wagmi.useSwitchChain)

describe('NetworkSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock setup
    mockUseSwitchChain.mockReturnValue({
      switchChain: vi.fn(),
      isPending: false,
      error: null,
    } as any)
  })

  describe('when wallet is not connected', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        isConnected: false,
      } as any)
    })

    it('renders null when disconnected', () => {
      const { container } = render(<NetworkSelector />)
      
      // Component should render nothing when wallet is not connected
      expect(container.firstChild).toBeNull()
    })
  })

  describe('when wallet is connected', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(1)
    })

    it('renders network selection interface', () => {
      render(<NetworkSelector />)
      
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('shows current network', () => {
      render(<NetworkSelector />)
      
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
    })

    it('handles unsupported network', () => {
      mockUseChainId.mockReturnValue(999) // Unsupported chain
      
      render(<NetworkSelector />)
      
      expect(screen.getByText('Unknown Network')).toBeInTheDocument()
    })

    it('handles pending state', () => {
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: true,
        error: null,
      } as any)
      
      render(<NetworkSelector />)
      
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('handles switch chain error', () => {
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: new Error('Network switch failed'),
      } as any)
      
      render(<NetworkSelector />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})