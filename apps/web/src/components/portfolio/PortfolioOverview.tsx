'use client'

import { useAccount, useChainId } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PieChart, TrendingUp, Wallet, DollarSign, RefreshCw, AlertCircle } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { CHAIN_IDS } from '@jarrbank/shared/src/constants/chains'
import { formatUSDValue } from '@jarrbank/shared/src/utils/format'
import { useState } from 'react'

export function PortfolioOverview() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const supportedChainIds = [
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.AVALANCHE
  ]

  const { data, isLoading, error, refetch } = trpc.portfolio.getPortfolioSummary.useQuery(
    {
      walletAddress: address!,
      chainIds: supportedChainIds
    },
    {
      enabled: !!address && isConnected,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  )

  const refreshMutation = trpc.portfolio.refreshPortfolio.useMutation({
    onMutate: () => setIsRefreshing(true),
    onSettled: () => {
      setIsRefreshing(false)
      refetch()
    }
  })

  const handleRefresh = () => {
    if (!address) return
    refreshMutation.mutate({
      walletAddress: address,
      chainId: chainId as any,
      forceRefresh: true
    })
  }

  if (!isConnected || !address) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <CardTitle>Portfolio Overview</CardTitle>
          </div>
          <CardDescription>
            Connect your wallet to view your portfolio
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Error Loading Portfolio</CardTitle>
          </div>
          <CardDescription>
            {error.message || 'Failed to load portfolio data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || BigInt(data.totalValueUSD) === 0n) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <CardTitle>Portfolio Overview</CardTitle>
          </div>
          <CardDescription>
            No tokens found in your wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your wallet does not have any tokens on the supported chains (Ethereum, Arbitrum, Avalanche).
            Transfer some tokens to see your portfolio.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalValueFormatted = formatUSDValue(BigInt(data.totalValueUSD))
  const healthScore = calculateHealthScore(data.assetComposition)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValueFormatted}</div>
            <p className="text-xs text-muted-foreground">
              Across {data.chainBreakdown.length} chains
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore}/100</div>
            <p className="text-xs text-muted-foreground">
              {healthScore >= 80 ? 'Excellent' : 
               healthScore >= 60 ? 'Good' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.topTokens.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.topTokens.length} tokens across chains
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chain Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Chain Distribution</CardTitle>
          <CardDescription>Portfolio value by blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.chainBreakdown.map((chain) => {
              const chainName = getChainName(chain.chainId)
              const value = formatUSDValue(BigInt(chain.valueUSD))
              
              return (
                <div key={chain.chainId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {chainName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{chainName}</p>
                      <p className="text-sm text-muted-foreground">{chain.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Top Holdings</CardTitle>
          <CardDescription>Your largest token positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topTokens.slice(0, 10).map((token, index) => {
              const balance = formatTokenAmount(BigInt(token.balance), token.metadata.decimals)
              const value = formatUSDValue(BigInt(token.valueUSD))
              
              return (
                <div key={`${token.tokenAddress}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {token.metadata.symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{token.metadata.symbol}</p>
                      <p className="text-sm text-muted-foreground">{token.metadata.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{balance} {token.metadata.symbol}</p>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function calculateHealthScore(composition: any[]): number {
  let score = 100
  
  const stablecoinPercentage = composition
    .find(c => c.category === 'STABLECOIN')?.percentage || 0
  const memePercentage = composition
    .find(c => c.category === 'MEME')?.percentage || 0

  if (stablecoinPercentage > 80) score -= 20
  else if (stablecoinPercentage < 10) score -= 10
  
  if (memePercentage > 30) score -= 30
  else if (memePercentage > 20) score -= 15
  
  const categoryCount = composition.filter(c => c.percentage > 5).length
  if (categoryCount < 2) score -= 15
  else if (categoryCount > 4) score += 10
  
  return Math.max(0, Math.min(100, score))
}

function getChainName(chainId: number): string {
  const names: Record<number, string> = {
    [CHAIN_IDS.ETHEREUM]: 'Ethereum',
    [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
    [CHAIN_IDS.AVALANCHE]: 'Avalanche'
  }
  return names[chainId] || 'Unknown'
}

function formatTokenAmount(amount: bigint, decimals: number): string {
  if (amount === 0n) return '0'
  
  const divisor = 10n ** BigInt(decimals)
  const quotient = amount / divisor
  const remainder = amount % divisor
  
  if (remainder === 0n) {
    return quotient.toString()
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0')
  const significantDecimals = Math.min(4, decimals)
  const trimmedRemainder = remainderStr.substring(0, significantDecimals).replace(/0+$/, '')
  
  if (trimmedRemainder.length === 0) {
    return quotient.toString()
  }
  
  return `${quotient}.${trimmedRemainder}`
}