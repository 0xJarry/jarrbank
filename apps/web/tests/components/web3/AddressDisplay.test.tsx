import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddressDisplay } from '@/components/web3/AddressDisplay'
import * as wagmi from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useEnsName: vi.fn(),
}))

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

const mockUseAccount = vi.mocked(wagmi.useAccount)
const mockUseEnsName = vi.mocked(wagmi.useEnsName)
const mockWriteText = vi.mocked(navigator.clipboard.writeText)

describe('AddressDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
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

    it('renders disconnected state', () => {
      render(<AddressDisplay />)
      
      expect(screen.getByText('Wallet Address')).toBeInTheDocument()
      expect(screen.getByText('No wallet connected')).toBeInTheDocument()
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
      
      expect(screen.getByText('Wallet Address')).toBeInTheDocument()
      expect(screen.getByText('Your connected wallet information')).toBeInTheDocument()
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
    })

    it('displays ENS name when available', () => {
      mockUseEnsName.mockReturnValue({
        data: 'vitalik.eth',
        isLoading: false,
        error: null,
      } as any)

      render(<AddressDisplay />)
      
      expect(screen.getByText('ENS Name')).toBeInTheDocument()
      expect(screen.getByText('vitalik.eth')).toBeInTheDocument()
    })

    it('shows ENS loading state', () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      render(<AddressDisplay />)
      
      expect(screen.getByText('Resolving ENS name...')).toBeInTheDocument()
    })

    it('shows ENS error state', () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('ENS lookup failed'),
      } as any)

      render(<AddressDisplay />)
      
      expect(screen.getByText('ENS lookup failed')).toBeInTheDocument()
    })

    it('copies address to clipboard when copy button is clicked', async () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      mockWriteText.mockResolvedValue(undefined)

      render(<AddressDisplay />)
      
      const copyButton = screen.getByRole('button')
      fireEvent.click(copyButton)
      
      expect(mockWriteText).toHaveBeenCalledWith(mockAddress)
    })

    it('shows copied confirmation message', async () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      mockWriteText.mockResolvedValue(undefined)

      render(<AddressDisplay />)
      
      const copyButton = screen.getByRole('button')
      fireEvent.click(copyButton)
      
      // Wait for the copy confirmation to appear
      await waitFor(() => {
        expect(screen.getByText('Address copied to clipboard!')).toBeInTheDocument()
      })

      // Fast forward timers to test auto-hide
      vi.advanceTimersByTime(2000)
      
      // Confirmation should disappear after timeout
      await waitFor(() => {
        expect(screen.queryByText('Address copied to clipboard!')).not.toBeInTheDocument()
      })
    })

    it('shows full address in details section', () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      render(<AddressDisplay />)
      
      const detailsElement = screen.getByText('Show full address')
      fireEvent.click(detailsElement)
      
      expect(screen.getByText(mockAddress)).toBeInTheDocument()
    })

    it('handles clipboard copy failure gracefully', async () => {
      mockUseEnsName.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as any)

      mockWriteText.mockRejectedValue(new Error('Clipboard failed'))

      render(<AddressDisplay />)
      
      const copyButton = screen.getByRole('button')
      fireEvent.click(copyButton)
      
      // Allow some time for the async clipboard operation to fail
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should not show copied message when clipboard fails
      expect(screen.queryByText('Address copied to clipboard!')).not.toBeInTheDocument()
    })
  })
})