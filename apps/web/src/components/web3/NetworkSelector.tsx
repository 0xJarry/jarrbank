'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Network, CheckCircle, AlertTriangle } from 'lucide-react'
import { supportedChains } from '@/lib/wagmi'
import { useState } from 'react'

export function NetworkSelector() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending, error } = useSwitchChain()
  const [pendingChainId, setPendingChainId] = useState<number | null>(null)

  const currentChain = supportedChains.find(chain => chain.id === chainId)
  const isSupported = supportedChains.some(chain => chain.id === chainId)

  const handleSwitchChain = async (targetChainId: number) => {
    setPendingChainId(targetChainId)
    try {
      const validChainIds = [1, 42161, 43114] as const
      if (validChainIds.includes(targetChainId as any)) {
        await switchChain({ chainId: targetChainId as typeof validChainIds[number] })
      }
    } finally {
      setPendingChainId(null)
    }
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md opacity-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            <CardTitle className="text-lg">Network</CardTitle>
          </div>
          <CardDescription>
            Connect your wallet to select a network
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          <CardTitle className="text-lg">Select Network</CardTitle>
        </div>
        <CardDescription>
          Switch between supported blockchain networks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isSupported && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">Current network is not supported. Please switch to a supported network.</p>
          </div>
        )}

        <div className="space-y-2">
          {supportedChains.map((chain) => {
            const isActive = chain.id === chainId
            const isLoading = isPending && pendingChainId === chain.id
            
            return (
              <Button
                key={chain.id}
                onClick={() => handleSwitchChain(chain.id)}
                disabled={isActive || isPending}
                variant={isActive ? "default" : "outline"}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isActive ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span>{chain.name}</span>
                </div>
                {isActive && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Active
                  </span>
                )}
              </Button>
            )
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Network switch failed</p>
              <p className="text-xs">{error.message}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}