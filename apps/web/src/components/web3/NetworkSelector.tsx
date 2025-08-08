'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Loader2, Network, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react'
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
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
          disabled={isPending}
        >
          <Network className="h-4 w-4" />
          <span className="text-sm">
            {currentChain?.name || 'Unknown Network'}
          </span>
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {!isSupported && (
          <>
            <div className="flex items-center gap-2 p-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Unsupported network</span>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {supportedChains.map((chain) => {
          const isActive = chain.id === chainId
          const isLoading = isPending && pendingChainId === chain.id
          
          return (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => handleSwitchChain(chain.id)}
              disabled={isActive || isPending}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isActive ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span>{chain.name}</span>
              </div>
              {isActive && (
                <span className="text-xs text-muted-foreground">Active</span>
              )}
            </DropdownMenuItem>
          )
        })}
        
        {error && (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center gap-2 p-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">{error.message}</span>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}