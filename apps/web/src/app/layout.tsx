import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Web3Provider } from '@/components/web3/Web3Provider'
import { TRPCProvider } from '@/providers/trpc-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JarrBank - Multi-chain DeFi Portfolio',
  description: 'Professional DeFi portfolio management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          <Web3Provider>
            {children}
          </Web3Provider>
        </TRPCProvider>
      </body>
    </html>
  )
}