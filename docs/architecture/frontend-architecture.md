# Frontend Architecture

Define frontend-specific architecture details based on the selected Next.js 15 framework, TypeScript, and shadcn/ui component system, integrating with the comprehensive UI/UX specification.

## Component Architecture

### Component Organization

```text
apps/web/src/
├── components/                 # Reusable UI components
│   ├── ui/                    # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── chart.tsx
│   │   └── ...
│   ├── portfolio/             # Portfolio-specific components
│   │   ├── PortfolioOverview.tsx
│   │   ├── HealthScore.tsx
│   │   ├── CompositionChart.tsx
│   │   └── AssetTable.tsx
│   ├── lp-positions/          # LP position components
│   │   ├── PositionCard.tsx
│   │   ├── PositionTable.tsx
│   │   ├── PerformanceChart.tsx
│   │   └── RewardsPanel.tsx
│   ├── workflows/             # Workflow automation components
│   │   ├── WorkflowWizard.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── TransactionPreview.tsx
│   │   └── ExecutionStatus.tsx
│   ├── web3/                  # Web3-specific components
│   │   ├── WalletConnection.tsx
│   │   ├── NetworkSelector.tsx
│   │   ├── TransactionButton.tsx
│   │   └── AddressDisplay.tsx
│   └── layout/                # Layout components
│       ├── DashboardLayout.tsx
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── MobileNav.tsx
├── app/                       # Next.js 15 App Router
│   ├── (dashboard)/           # Dashboard route group
│   │   ├── page.tsx          # Main dashboard
│   │   ├── portfolio/
│   │   ├── positions/
│   │   ├── workflows/
│   │   └── analytics/
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── providers.tsx         # App providers
├── hooks/                     # Custom React hooks
├── lib/                       # Utilities and configurations
├── stores/                    # Zustand state management
└── types/                     # TypeScript type definitions
```

### Component Template

```typescript
// Portfolio component example following established patterns
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortfolio } from '@/hooks/usePortfolio';
import { formatCurrency, formatTokenAmount } from '@/lib/utils';
import type { Portfolio } from '@/types/portfolio';

interface PortfolioOverviewProps {
  userId: string;
  chainIds?: number[];
  refreshInterval?: number;
}

export function PortfolioOverview({ 
  userId, 
  chainIds, 
  refreshInterval = 30000 
}: PortfolioOverviewProps) {
  const { 
    data: portfolios, 
    isLoading, 
    error, 
    refetch 
  } = usePortfolio({ userId, chainIds, refreshInterval });

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  if (error) {
    return <PortfolioError error={error} onRetry={refetch} />;
  }

  const totalValue = portfolios?.reduce((sum, p) => sum + p.totalValue, BigInt(0)) ?? BigInt(0);
  const avgHealthScore = portfolios?.reduce((sum, p) => sum + p.healthScore, 0) / portfolios.length;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Portfolio Overview</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(totalValue, 18, 'USD')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Health Score</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{avgHealthScore?.toFixed(0)}</p>
              <Badge variant={getHealthVariant(avgHealthScore)}>
                {getHealthLabel(avgHealthScore)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## State Management Architecture

### State Structure

```typescript
// Zustand stores for client-side state management
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Dashboard layout state
interface DashboardState {
  layout: DashboardSection[];
  selectedChains: number[];
  refreshInterval: number;
  
  // Actions
  updateLayout: (layout: DashboardSection[]) => void;
  toggleChain: (chainId: number) => void;
  setRefreshInterval: (interval: number) => void;
  resetLayout: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    persist(
      (set, get) => ({
        layout: DEFAULT_DASHBOARD_LAYOUT,
        selectedChains: [1, 42161, 43114], // ETH, ARB, AVAX
        refreshInterval: 30000,
        
        updateLayout: (layout) => set({ layout }),
        toggleChain: (chainId) => set((state) => ({
          selectedChains: state.selectedChains.includes(chainId)
            ? state.selectedChains.filter(id => id !== chainId)
            : [...state.selectedChains, chainId]
        })),
        setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
        resetLayout: () => set({ layout: DEFAULT_DASHBOARD_LAYOUT })
      }),
      { name: 'dashboard-storage' }
    )
  )
);

// Workflow execution state
interface WorkflowState {
  currentWorkflow: WorkflowExecution | null;
  executionStep: number;
  isExecuting: boolean;
  
  // Actions
  startWorkflow: (workflow: WorkflowExecution) => void;
  updateStep: (step: number, status: StepStatus) => void;
  completeWorkflow: (result: WorkflowResult) => void;
  resetWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools((set) => ({
    currentWorkflow: null,
    executionStep: 0,
    isExecuting: false,
    
    startWorkflow: (workflow) => set({ 
      currentWorkflow: workflow, 
      executionStep: 0, 
      isExecuting: true 
    }),
    updateStep: (step, status) => set((state) => ({
      executionStep: step,
      currentWorkflow: state.currentWorkflow ? {
        ...state.currentWorkflow,
        steps: state.currentWorkflow.steps.map((s, idx) => 
          idx === step ? { ...s, status } : s
        )
      } : null
    })),
    completeWorkflow: (result) => set({ 
      isExecuting: false, 
      currentWorkflow: null, 
      executionStep: 0 
    }),
    resetWorkflow: () => set({ 
      currentWorkflow: null, 
      executionStep: 0, 
      isExecuting: false 
    })
  }))
);
```

### State Management Patterns

- **Server State:** TanStack Query handles all server data (portfolios, LP positions, workflows)
- **Client State:** Zustand manages UI state (dashboard layout, workflow progress, preferences)
- **Wallet State:** Wagmi manages Web3 connection state and blockchain interactions
- **Persistence:** Dashboard preferences and layout persist to localStorage via Zustand middleware

## Routing Architecture  

### Route Organization

```text
app/
├── (dashboard)/               # Protected dashboard routes
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── page.tsx              # Main portfolio dashboard
│   ├── portfolio/
│   │   ├── page.tsx          # Portfolio overview
│   │   └── [chainId]/
│   │       └── page.tsx      # Chain-specific portfolio
│   ├── positions/
│   │   ├── page.tsx          # LP positions table
│   │   └── [positionId]/
│   │       └── page.tsx      # Position details
│   ├── workflows/
│   │   ├── page.tsx          # Workflow history
│   │   ├── compound/
│   │   │   └── page.tsx      # Compounding wizard
│   │   └── [workflowId]/
│   │       └── page.tsx      # Workflow details
│   └── settings/
│       ├── page.tsx          # User preferences
│       └── dashboard/
│           └── page.tsx      # Dashboard customization
├── connect/                   # Wallet connection
│   └── page.tsx
├── layout.tsx                # Root layout
├── loading.tsx               # Global loading UI
├── error.tsx                 # Global error boundary
└── not-found.tsx            # 404 page
```

### Protected Route Pattern

```typescript
// Layout with wallet connection check
export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { address, isConnected } = useAccount();
  
  if (!isConnected) {
    redirect('/connect');
  }
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        {children}
      </main>
    </div>
  );
}
```

## Frontend Services Layer

### API Client Setup

```typescript
// tRPC client configuration with TanStack Query
import { createTRPCReact } from '@trpc/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from '../../api/src/router';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

// Query client with optimized settings for DeFi data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds for portfolio data
      refetchInterval: (data, query) => {
        // Smart refresh intervals based on data type
        if (query.queryKey[0] === 'portfolio') return 30000;
        if (query.queryKey[0] === 'lpPosition') return 60000;
        if (query.queryKey[0] === 'prices') return 15000;
        return false;
      },
      retry: (failureCount, error) => {
        // Exponential backoff for RPC failures
        if (error.data?.code === 'RPC_ERROR') {
          return failureCount < 3;
        }
        return failureCount < 1;
      }
    },
    mutations: {
      retry: false // No retry for workflow mutations
    }
  }
});

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const trpcClient = trpc.createClient({
    transformer: superjson,
    links: [
      loggerLink({
        enabled: (opts) => process.env.NODE_ENV === 'development'
      }),
      httpBatchLink({
        url: '/api/trpc',
        headers: async () => {
          const token = await getAuthToken();
          return {
            authorization: token ? `Bearer ${token}` : undefined
          };
        }
      })
    ]
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Service Example

```typescript
// Custom hook combining tRPC with local state
import { trpc } from '@/lib/trpc';
import { useDashboardStore } from '@/stores/dashboard';
import { useAccount } from 'wagmi';

export function usePortfolio(options?: {
  refreshInterval?: number;
  includeHealthAnalysis?: boolean;
}) {
  const { address } = useAccount();
  const { selectedChains } = useDashboardStore();
  
  // Parallel data fetching
  const portfolioQuery = trpc.portfolio.getPortfolio.useQuery(
    {
      walletAddress: address!,
      chainIds: selectedChains
    },
    {
      enabled: !!address,
      refetchInterval: options?.refreshInterval ?? 30000,
      staleTime: 15000
    }
  );
  
  const healthQuery = trpc.analytics.getHealthAnalysis.useQuery(
    {
      portfolioIds: portfolioQuery.data?.map(p => p.id) ?? []
    },
    {
      enabled: !!portfolioQuery.data && options?.includeHealthAnalysis,
      staleTime: 60000 // Health analysis changes less frequently
    }
  );
  
  // Optimistic updates for refresh
  const refreshMutation = trpc.portfolio.refreshPortfolio.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches
      await trpc.utils.portfolio.getPortfolio.cancel();
      
      // Snapshot previous value
      const previousData = trpc.utils.portfolio.getPortfolio.getData();
      
      // Return context for rollback
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        trpc.utils.portfolio.getPortfolio.setData(variables, context.previousData);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      trpc.utils.portfolio.getPortfolio.invalidate();
    }
  });
  
  return {
    data: portfolioQuery.data,
    healthData: healthQuery.data,
    isLoading: portfolioQuery.isLoading || (options?.includeHealthAnalysis && healthQuery.isLoading),
    error: portfolioQuery.error || healthQuery.error,
    refetch: () => refreshMutation.mutate({
      walletAddress: address!,
      chainIds: selectedChains,
      forceRefresh: true
    })
  };
}
```
