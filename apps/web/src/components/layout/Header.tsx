'use client'

import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { WalletConnection } from '@/components/web3/WalletConnection'
import { NetworkSelector } from '@/components/web3/NetworkSelector'
import { AddressDisplay } from '@/components/web3/AddressDisplay'
import { Wallet, Menu } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { isConnected } = useAccount()
  const [showWalletModal, setShowWalletModal] = useState(false)

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <h1 className="font-bold text-xl">JarrBank</h1>
            </div>
          </div>

          {/* Right side - Wallet connection */}
          <div className="flex items-center gap-3">
            {!isConnected ? (
              <Button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <NetworkSelector />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-1 max-w-md w-full">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWalletModal(false)}
              >
                ✕
              </Button>
            </div>
            <WalletConnection />
            <div className="mt-4">
              <AddressDisplay />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}