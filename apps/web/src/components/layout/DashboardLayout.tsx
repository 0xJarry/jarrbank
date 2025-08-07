'use client'

import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {/* Sidebar */}
        <div className={cn(
          "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)]",
          "lg:relative lg:top-0 lg:h-[calc(100vh-4rem)]",
          !sidebarOpen && "hidden lg:block"
        )}>
          <Sidebar isOpen={sidebarOpen} />
        </div>

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-200 ease-in-out",
          "lg:ml-0", // Remove left margin on large screens as sidebar is in normal flow
          sidebarOpen && "lg:ml-0" // Keep consistent spacing
        )}>
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}