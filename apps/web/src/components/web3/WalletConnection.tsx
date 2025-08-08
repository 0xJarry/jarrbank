'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Wallet, CheckCircle, AlertCircle, LogOut } from 'lucide-react'

interface WalletConnectionProps {
  showCard?: boolean
}

export function WalletConnection({ showCard = true }: WalletConnectionProps) {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const handleDisconnect = () => {
    disconnect()
    setShowDisconnectConfirm(false)
  }

  if (isConnected && address) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Wallet Connected</CardTitle>
          </div>
          <CardDescription>
            Your wallet is successfully connected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium text-muted-foreground">Connected Address</p>
            <p className="text-sm font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>
          </div>
          
          {!showDisconnectConfirm ? (
            <Button 
              onClick={() => setShowDisconnectConfirm(true)}
              variant="outline"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect Wallet
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Are you sure you want to disconnect?</p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleDisconnect}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  Yes, Disconnect
                </Button>
                <Button 
                  onClick={() => setShowDisconnectConfirm(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const content = (
    <>
      {showCard && (
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <CardTitle className="text-lg">Connect Your Wallet</CardTitle>
          </div>
          <CardDescription>
            Choose a wallet to connect to JarrBank
          </CardDescription>
        </CardHeader>
      )}
      {!showCard && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose a wallet to connect to JarrBank
          </p>
        </div>
      )}
      <div className="space-y-3">
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={isPending || isConnecting}
            variant="outline"
            className="w-full justify-start"
          >
            {isPending && connector.name === connectors.find(c => c.name === connector.name)?.name && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {connector.name}
          </Button>
        ))}
        
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error.message}</p>
          </div>
        )}
        
        {isConnecting && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <p className="text-sm">Connecting to wallet...</p>
          </div>
        )}
      </div>
    </>
  )

  if (!showCard) {
    return content
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-3 pt-6">
        {content}
      </CardContent>
    </Card>
  )
}