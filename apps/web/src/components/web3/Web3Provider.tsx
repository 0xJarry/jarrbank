'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { testConfigConnected, testConfigAvalanche, testConfigDisconnected } from '@/lib/wagmi-test'

const queryClient = new QueryClient()

interface Web3ProviderProps {
  children: React.ReactNode
  testConfig?: any // Allow passing test config from fixtures
}

// Detect test environment
function isTestEnvironment() {
  if (typeof window === 'undefined') return false
  
  return (
    // Playwright test environment
    window.location.hostname === 'localhost' &&
    (window.location.search.includes('test=true') || 
     // Playwright user agent detection
     navigator.userAgent.includes('Playwright'))
  )
}

export function Web3Provider({ children, testConfig }: Web3ProviderProps) {
  // Get test configuration based on environment
  function getTestConfig() {
    if (typeof window === 'undefined') return testConfigConnected
    
    const testNetwork = (window as any).__TEST_NETWORK__
    switch (testNetwork) {
      case 'avalanche':
        return testConfigAvalanche
      case 'disconnected':
        return testConfigDisconnected
      default:
        return testConfigConnected
    }
  }
  
  // Use test config in test environment, otherwise use production config
  const wagmiConfig = testConfig || (isTestEnvironment() ? getTestConfig() : config)
  
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}