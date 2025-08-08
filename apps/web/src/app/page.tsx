'use client'

import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 bg-clip-text text-transparent">
              JarrBank
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional multi-chain DeFi portfolio management platform
          </p>
        </div>

        <PortfolioOverview />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Portfolio Analytics
                <span className="text-primary">→</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced portfolio health analytics and insights
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                LP Tracking
                <span className="text-primary">→</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Liquidity provider position tracking and management
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Multi-Chain
                <span className="text-primary">→</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track assets across Ethereum, Arbitrum, and Avalanche
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Real-time Data
                <span className="text-primary">→</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Live portfolio updates and price tracking
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}