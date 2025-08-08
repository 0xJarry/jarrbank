import { createConfig, http } from 'wagmi'
import { mainnet, arbitrum, avalanche } from 'wagmi/chains'
import { metaMask, walletConnect, coinbaseWallet, injected } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

export const config = createConfig({
  chains: [mainnet, arbitrum, avalanche],
  connectors: [
    metaMask(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'JarrBank',
        description: 'DeFi Portfolio Management Platform',
        url: 'https://jarrbank.vercel.app',
        icons: ['https://jarrbank.vercel.app/favicon.ico']
      }
    }),
    coinbaseWallet({ 
      appName: 'JarrBank',
      appLogoUrl: 'https://jarrbank.vercel.app/favicon.ico'
    }),
    injected({ 
      target: () => ({
        id: 'rabbyWallet',
        name: 'Rabby Wallet',
        provider: typeof window !== 'undefined' ? (window as any).ethereum : undefined
      })
    })
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_ETH_RPC_URL),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_ARB_RPC_URL),
    [avalanche.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_AVAX_RPC_URL)
  },
})

export const supportedChains = [mainnet, arbitrum, avalanche]

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}