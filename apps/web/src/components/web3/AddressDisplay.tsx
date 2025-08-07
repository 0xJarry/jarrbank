'use client'

import { useState } from 'react'
import { useAccount, useEnsName } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, User, CheckCircle, AlertCircle } from 'lucide-react'
import { mainnet } from 'wagmi/chains'

interface AddressDisplayProps {
  className?: string
}

export function AddressDisplay({ className }: AddressDisplayProps) {
  const { address, isConnected } = useAccount()
  const { data: ensName, isLoading: isLoadingEns, error: ensError } = useEnsName({
    address,
    chainId: mainnet.id
  })
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
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle className="text-lg">Wallet Address</CardTitle>
          </div>
          <CardDescription>
            No wallet connected
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <CardTitle className="text-lg">Wallet Address</CardTitle>
        </div>
        <CardDescription>
          Your connected wallet information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ENS Name Display */}
        {isLoadingEns ? (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">Resolving ENS name...</p>
          </div>
        ) : ensName ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">ENS Name</p>
                <p className="text-sm text-green-700">{ensName}</p>
              </div>
            </div>
          </div>
        ) : ensError ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">ENS lookup failed</p>
            </div>
          </div>
        ) : null}

        {/* Address Display */}
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
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
        </div>

        {/* Full Address (Expandable) */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Show full address
          </summary>
          <div className="mt-2 p-3 bg-muted rounded-md">
            <p className="text-xs font-mono break-all">{address}</p>
          </div>
        </details>

        {copied && (
          <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm">Address copied to clipboard!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}