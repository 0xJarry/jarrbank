import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NetworkSelector } from '@/components/web3/NetworkSelector'
import * as wagmi from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useChainId: vi.fn(),
  useSwitchChain: vi.fn(),
}))

// Mock supportedChains
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
  })

  describe('when wallet is not connected', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        isConnected: false,
      } as any)
      mockUseChainId.mockReturnValue(1)
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      } as any)
    })

    it('renders disabled state', () => {
      render(<NetworkSelector />)
      
      expect(screen.getByText('Network')).toBeInTheDocument()
      expect(screen.getByText('Connect your wallet to select a network')).toBeInTheDocument()
    })
  })

  describe('when wallet is connected', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        isConnected: true,
      } as any)
      mockUseChainId.mockReturnValue(1)
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: null,
      } as any)
    })

    it('renders network selection interface', () => {
      render(<NetworkSelector />)
      
      expect(screen.getByText('Select Network')).toBeInTheDocument()
      expect(screen.getByText('Switch between supported blockchain networks')).toBeInTheDocument()
    })

    it('displays all supported networks', () => {
      render(<NetworkSelector />)
      
      expect(screen.getByRole('button', { name: /Ethereum/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Arbitrum/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Avalanche/ })).toBeInTheDocument()
    })

    it('marks current network as active', () => {
      render(<NetworkSelector />)
      
      const ethereumButton = screen.getByRole('button', { name: /Ethereum/ })
      expect(ethereumButton).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('calls switchChain when network button is clicked', async () => {
      const mockSwitchChain = vi.fn()
      mockUseSwitchChain.mockReturnValue({
        switchChain: mockSwitchChain,
        isPending: false,
        error: null,
      } as any)

      render(<NetworkSelector />)
      
      fireEvent.click(screen.getByRole('button', { name: /Arbitrum/ }))
      
      await waitFor(() => {
        expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: 42161 })
      })
    })

    it('shows loading state when switching networks', () => {
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: true,
        error: null,
      } as any)

      render(<NetworkSelector />)
      
      expect(screen.getByRole('button', { name: /Ethereum/ })).toBeDisabled()
    })

    it('displays error message when network switch fails', () => {
      mockUseSwitchChain.mockReturnValue({
        switchChain: vi.fn(),
        isPending: false,
        error: new Error('Network switch failed'),
      } as any)

      render(<NetworkSelector />)
      
      expect(screen.getByText('Network switch failed')).toBeInTheDocument()
      expect(screen.getByText('Network switch failed')).toBeInTheDocument()
    })

    it('shows unsupported network warning', () => {
      mockUseChainId.mockReturnValue(56) // BSC chain ID (unsupported)

      render(<NetworkSelector />)
      
      expect(screen.getByText(/Current network is not supported/)).toBeInTheDocument()
    })
  })
})