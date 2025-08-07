'use client'

import { useAccount, useChainId } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateMockPortfolio } from '@/lib/mockData'
import { formatEther } from 'viem'
import { PieChart, TrendingUp, Wallet, DollarSign } from 'lucide-react'

export function PortfolioOverview() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

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

  const portfolio = generateMockPortfolio(address, chainId)
  const totalValueFormatted = parseFloat(formatEther(portfolio.totalValue)).toLocaleString(
    'en-US',
    { style: 'currency', currency: 'USD' }
  )

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValueFormatted}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +2.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.healthScore}/100</div>
            <p className="text-xs text-muted-foreground">
              {portfolio.healthScore >= 80 ? 'Excellent' : 
               portfolio.healthScore >= 60 ? 'Good' : 'Needs Attention'}
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
              {portfolio.composition.tokens.length + portfolio.composition.lpPositions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolio.composition.tokens.length} tokens, {portfolio.composition.lpPositions.length} LP positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Token Holdings</CardTitle>
          <CardDescription>Your current token balances and values</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolio.composition.tokens.map((token, index) => {
              const balance = parseFloat(formatEther(token.balance))
              const value = parseFloat(formatEther(token.valueUSD))
              
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
                    <p className="font-medium">{balance.toFixed(4)} {token.metadata.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* LP Positions */}
      {portfolio.composition.lpPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Pool Positions</CardTitle>
            <CardDescription>Your active LP positions across DeFi protocols</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolio.composition.lpPositions.map((position, index) => {
                const value = parseFloat(formatEther(position.totalValueUSD))
                
                return (
                  <div key={`${position.poolAddress}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        LP
                      </div>
                      <div>
                        <p className="font-medium">{position.poolName}</p>
                        <p className="text-sm text-muted-foreground capitalize">{position.protocolId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      {position.apr && (
                        <p className="text-sm text-green-600">
                          {position.apr.toFixed(1)}% APR
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}