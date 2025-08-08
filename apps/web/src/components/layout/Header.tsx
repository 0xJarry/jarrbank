'use client'

import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { WalletConnection } from '@/components/web3/WalletConnection'
import { NetworkSelector } from '@/components/web3/NetworkSelector'
import { AddressDisplay } from '@/components/web3/AddressDisplay'
import { Wallet, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { isConnected } = useAccount()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const modal = showWalletModal && mounted ? createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="relative max-w-lg w-full mx-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWalletModal(false)}
            className="absolute top-3 right-3 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full z-10"
          >
            ✕
          </Button>
          <div className="p-6">
            <WalletConnection showCard={false} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
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
                  <AddressDisplay />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Render modal via portal */}
      {modal}
    </>
  )
}