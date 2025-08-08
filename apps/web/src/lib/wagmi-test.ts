import { createConfig, http } from 'wagmi'
import { mainnet, arbitrum, avalanche } from 'wagmi/chains'
import { mock } from 'wagmi/connectors'

// Test wallet addresses
export const TEST_ADDRESSES = {
  DEFAULT: '0x742d35Cc6634C0532925a3b8D000B8d8BE6a7871',
  WHALE: '0x8ba1f109551bD432803012645Hac136c22C51204',
  EMPTY: '0x0000000000000000000000000000000000000001'
} as const

// Test configuration for connected wallet (Mainnet)
export const testConfigConnected = createConfig({
  chains: [mainnet, arbitrum, avalanche],
  connectors: [
    mock({
      accounts: [TEST_ADDRESSES.DEFAULT],
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http()
  },
})

// Test configuration for Avalanche network
export const testConfigAvalanche = createConfig({
  chains: [mainnet, arbitrum, avalanche],
  connectors: [
    mock({
      accounts: [TEST_ADDRESSES.DEFAULT],
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http()
  },
})

// Test configuration for whale account
export const testConfigWhale = createConfig({
  chains: [mainnet, arbitrum, avalanche],
  connectors: [
    mock({
      accounts: [TEST_ADDRESSES.WHALE],
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http()
  },
})

// Test configuration for disconnected state (no mock connector)
export const testConfigDisconnected = createConfig({
  chains: [mainnet, arbitrum, avalanche],
  connectors: [], // No connectors = disconnected state
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http()
  },
})

