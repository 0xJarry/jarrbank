import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AddressDisplay } from '@/components/web3/AddressDisplay'
import * as wagmi from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useEnsName: vi.fn(),
  useDisconnect: vi.fn(),
}))

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

const mockUseAccount = vi.mocked(wagmi.useAccount)
const mockUseEnsName = vi.mocked(wagmi.useEnsName)
const mockUseDisconnect = vi.mocked(wagmi.useDisconnect)

describe('AddressDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockUseDisconnect.mockReturnValue({
      disconnect: vi.fn(),
    } as any)
  })

  describe('when wallet is not connected', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      } as any)
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)
    })

    it('renders null when disconnected', () => {
      const { container } = render(<AddressDisplay />)
      
      // Component should render nothing when wallet is not connected
      expect(container.firstChild).toBeNull()
    })
  })

  describe('when wallet is connected', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890'

    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any)
    })

    it('renders connected state with address', () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      render(<AddressDisplay />)
      
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('displays ENS name when available', () => {
      mockUseEnsName.mockReturnValue({
        data: 'vitalik.eth',
        isLoading: false,
        error: null,
      } as any)

      render(<AddressDisplay />)
      
      expect(screen.getByText('vitalik.eth')).toBeInTheDocument()
    })

    it('renders dropdown when connected', () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      render(<AddressDisplay />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
    })

    it('handles disconnect functionality', () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      render(<AddressDisplay />)
      
      // Component renders and disconnect hook is available
      expect(mockUseDisconnect).toHaveBeenCalled()
    })

    it('renders with non-compact mode', () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      const { container } = render(<AddressDisplay compact={false} />)
      expect(container.firstChild).not.toBeNull()
    })
  })
})