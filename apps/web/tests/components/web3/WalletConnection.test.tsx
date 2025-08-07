import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WalletConnection } from '@/components/web3/WalletConnection'
import * as wagmi from 'wagmi'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
}))

const mockUseAccount = vi.mocked(wagmi.useAccount)
const mockUseConnect = vi.mocked(wagmi.useConnect)
const mockUseDisconnect = vi.mocked(wagmi.useDisconnect)

describe('WalletConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when wallet is not connected', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        isConnecting: false,
      } as any)

      mockUseConnect.mockReturnValue({
        connect: vi.fn(),
        connectors: [
          { uid: '1', name: 'MetaMask' },
          { uid: '2', name: 'WalletConnect' },
          { uid: '3', name: 'Coinbase Wallet' },
        ],
        error: null,
        isPending: false,
      } as any)

      mockUseDisconnect.mockReturnValue({
        disconnect: vi.fn(),
      } as any)
    })

    it('renders connect wallet interface', () => {
      render(<WalletConnection />)
      
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
      expect(screen.getByText('Choose a wallet to connect to JarrBank')).toBeInTheDocument()
    })

    it('displays all available connectors', () => {
      render(<WalletConnection />)
      
      expect(screen.getByRole('button', { name: 'MetaMask' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'WalletConnect' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Coinbase Wallet' })).toBeInTheDocument()
    })

    it('calls connect when connector button is clicked', () => {
      const mockConnect = vi.fn()
      mockUseConnect.mockReturnValue({
        connect: mockConnect,
        connectors: [{ uid: '1', name: 'MetaMask' }],
        error: null,
        isPending: false,
      } as any)

      render(<WalletConnection />)
      
      fireEvent.click(screen.getByRole('button', { name: 'MetaMask' }))
      
      expect(mockConnect).toHaveBeenCalledWith({ connector: { uid: '1', name: 'MetaMask' } })
    })

    it('displays error message when connection fails', () => {
      mockUseConnect.mockReturnValue({
        connect: vi.fn(),
        connectors: [],
        error: new Error('Connection failed'),
        isPending: false,
      } as any)

      render(<WalletConnection />)
      
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
    })

    it('shows connecting state', () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
        isConnecting: true,
      } as any)

      render(<WalletConnection />)
      
      expect(screen.getByText('Connecting to wallet...')).toBeInTheDocument()
    })
  })

  describe('when wallet is connected', () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        isConnecting: false,
      } as any)

      mockUseConnect.mockReturnValue({
        connect: vi.fn(),
        connectors: [],
        error: null,
        isPending: false,
      } as any)

      mockUseDisconnect.mockReturnValue({
        disconnect: vi.fn(),
      } as any)
    })

    it('renders connected state', () => {
      render(<WalletConnection />)
      
      expect(screen.getByText('Wallet Connected')).toBeInTheDocument()
      expect(screen.getByText('Your wallet is successfully connected')).toBeInTheDocument()
    })

    it('displays truncated address', () => {
      render(<WalletConnection />)
      
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument()
    })

    it('shows disconnect button', () => {
      render(<WalletConnection />)
      
      expect(screen.getByRole('button', { name: 'Disconnect Wallet' })).toBeInTheDocument()
    })

    it('shows confirmation dialog when disconnect is clicked', async () => {
      render(<WalletConnection />)
      
      fireEvent.click(screen.getByRole('button', { name: 'Disconnect Wallet' }))
      
      await waitFor(() => {
        expect(screen.getByText('Are you sure you want to disconnect?')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Yes, Disconnect' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      })
    })

    it('calls disconnect when confirmed', async () => {
      const mockDisconnect = vi.fn()
      mockUseDisconnect.mockReturnValue({
        disconnect: mockDisconnect,
      } as any)

      render(<WalletConnection />)
      
      fireEvent.click(screen.getByRole('button', { name: 'Disconnect Wallet' }))
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Yes, Disconnect' }))
      })
      
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })
})