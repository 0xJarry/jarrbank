'use client'

import { useAccount } from 'wagmi'
import { Card, CardContent } from '@/components/ui/card'
import { AddressDisplay } from '@/components/web3/AddressDisplay'
import { Button } from '@/components/ui/button'
import { Home, PieChart, History, Settings, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
  isOpen?: boolean
}

const navigationItems = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    active: true
  },
  {
    label: 'Portfolio',
    icon: PieChart,
    href: '/portfolio',
    active: false
  },
  {
    label: 'Analytics',
    icon: TrendingUp,
    href: '/analytics',
    active: false
  },
  {
    label: 'History',
    icon: History,
    href: '/history',
    active: false
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    active: false
  }
]

export function Sidebar({ className, isOpen = true }: SidebarProps) {
  const { isConnected } = useAccount()

  return (
    <aside className={cn(
      "w-72 bg-background border-r transition-transform duration-200 ease-in-out",
      !isOpen && "transform -translate-x-full lg:translate-x-0",
      className
    )}>
      <div className="p-4 space-y-4">
        {/* Wallet Info */}
        {isConnected && (
          <AddressDisplay className="w-full" />
        )}

        {/* Navigation */}
        <Card>
          <CardContent className="p-3">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.href}
                    variant={item.active ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      !item.active && "text-muted-foreground hover:text-foreground"
                    )}
                    disabled={!isConnected && item.href !== '/dashboard'}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {isConnected && (
          <Card>
            <CardContent className="p-3">
              <h3 className="font-medium mb-3 text-sm">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium">Ethereum</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Price</span>
                  <span className="font-medium">~15 gwei</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ETH Price</span>
                  <span className="font-medium text-green-600">$2,300</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <Card>
            <CardContent className="p-3">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to access all features
                </p>
                <div className="w-full h-1 bg-muted rounded">
                  <div className="w-1/3 h-1 bg-orange-500 rounded"></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Limited functionality available
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </aside>
  )
}