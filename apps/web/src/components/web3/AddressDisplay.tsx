'use client'

import { useState } from 'react'
import { useAccount, useEnsName, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Copy, User, CheckCircle, LogOut, ChevronDown } from 'lucide-react'
import { mainnet } from 'wagmi/chains'

interface AddressDisplayProps {
  className?: string
  compact?: boolean
}

export function AddressDisplay({ className, compact = true }: AddressDisplayProps) {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id
  })
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Silently fail - clipboard API might not be available in all contexts
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isConnected || !address) {
    return null
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            <span className="text-sm font-mono">
              {ensName || formatAddress(address)}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuLabel>Wallet</DropdownMenuLabel>
          
          {ensName && (
            <DropdownMenuItem disabled>
              <span className="text-sm">{ensName}</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem
            onClick={copyToClipboard}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-mono">{formatAddress(address)}</span>
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
          
          {copied && (
            <DropdownMenuItem disabled>
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-xs text-green-600">Copied!</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => disconnect()}
            className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Non-compact version for standalone use (keeping original Card design)
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <User className="h-5 w-5" />
        <h3 className="font-medium">Wallet Address</h3>
      </div>
      
      {ensName && (
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">ENS Name</p>
          <p className="text-sm font-medium">{ensName}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Address</p>
          <p className="text-sm font-mono">{formatAddress(address)}</p>
        </div>
        <Button
          onClick={copyToClipboard}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          {copied ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {copied && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 text-green-700 rounded-md">
          <CheckCircle className="h-4 w-4" />
          <p className="text-sm">Address copied!</p>
        </div>
      )}
    </div>
  )
}