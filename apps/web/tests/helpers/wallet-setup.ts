import { Page } from '@playwright/test'

export interface WalletSetupOptions {
  address?: string
  chainId?: string
  balance?: string
  networkName?: string
}

export async function setupConnectedWallet(page: Page, options: WalletSetupOptions = {}) {
  const {
    address = '0x742d35Cc6634C0532925a3b8D000B8d8BE6a7871',
    chainId = '0x1', // Mainnet
    balance = '1000000000000000000', // 1 ETH in wei
    networkName = 'Ethereum Mainnet'
  } = options

  // Inject mock wallet BEFORE page loads - this is critical for wagmi
  await page.addInitScript(({ address, chainId, balance, networkName }) => {
    // Store event handlers for proper event management
    const eventHandlers = new Map<string, Function[]>()

    // Mock ethereum provider that's compatible with wagmi
    const mockEthereum = {
      isMetaMask: true,
      isConnected: () => true,
      // Essential for wagmi compatibility
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        console.log(`[Mock Wallet] ${method}`, params)
        
        switch (method) {
          case 'eth_requestAccounts':
            // Trigger accountsChanged event for wagmi
            setTimeout(() => {
              const handlers = eventHandlers.get('accountsChanged') || []
              handlers.forEach(handler => handler([address]))
            }, 10)
            return [address]
          case 'eth_accounts':
            return [address]
          case 'eth_chainId':
            return chainId
          case 'eth_getBalance':
            return balance
          case 'net_version':
            return chainId === '0x1' ? '1' : '137'
          case 'wallet_switchEthereumChain':
            return null
          case 'wallet_addEthereumChain':  
            return null
          case 'eth_sendTransaction':
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
          case 'personal_sign':
            return '0xsignature...'
          case 'eth_signTypedData_v4':
            return '0xsignature...'
          default:
            console.warn(`[Mock Wallet] Unhandled method: ${method}`)
            return null
        }
      },
      // Proper event handling for wagmi
      on: (event: string, handler: Function) => {
        console.log(`[Mock Wallet] Event listener added: ${event}`)
        if (!eventHandlers.has(event)) {
          eventHandlers.set(event, [])
        }
        eventHandlers.get(event)!.push(handler)
      },
      removeListener: (event: string, handler: Function) => {
        console.log(`[Mock Wallet] Event listener removed: ${event}`)
        const handlers = eventHandlers.get(event) || []
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      },
      // MetaMask specific properties
      selectedAddress: address,
      chainId: chainId,
      networkVersion: chainId === '0x1' ? '1' : '137',
      // Add EIP-1193 provider interface
      _state: {
        accounts: [address],
        isConnected: true,
        isUnlocked: true,
        initialized: true,
        isPermanentlyDisconnected: false
      }
    }

    // Set up the mock ethereum object globally
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: false,
      configurable: false
    })

    // Also set up for detection by various wallet libraries
    ;(window as any).web3 = { currentProvider: mockEthereum }
    ;(window as any).ethereum = mockEthereum

    // Trigger initialization events that wagmi expects
    setTimeout(() => {
      // Ethereum provider initialization event
      window.dispatchEvent(new Event('ethereum#initialized'))
      
      // Connection events
      const connectEvent = new CustomEvent('connect', { 
        detail: { chainId } 
      })
      window.dispatchEvent(connectEvent)

      console.log(`[Mock Wallet] Initialized with address: ${address}, chainId: ${chainId}`)
    }, 50)
  }, { address, chainId, balance, networkName })
}

export const WALLET_ADDRESSES = {
  DEFAULT: '0x742d35Cc6634C0532925a3b8D000B8d8BE6a7871',
  WHALE: '0x8ba1f109551bD432803012645Hac136c22C51204',
  EMPTY: '0x0000000000000000000000000000000000000001'
}

export const CHAIN_IDS = {
  MAINNET: '0x1',
  AVALANCHE: '0xa86a',
  ARBITRUM: '0xa4b1',
  SEPOLIA: '0xaa36a7'
}