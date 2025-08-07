# API Specification

Based on the tRPC selection from the Tech Stack, I'll provide the tRPC router definitions that implement type-safe APIs for all JarrBank functionality. This approach ensures end-to-end type safety from database to frontend while maintaining the flexibility needed for complex DeFi operations.

## tRPC Router Definitions

```typescript
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './trpc';

// Input/Output Schemas
const ChainIdSchema = z.enum(['1', '42161', '43114']); // Ethereum, Arbitrum, Avalanche
const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const BigIntSchema = z.string().transform((val) => BigInt(val));

// Portfolio Router
export const portfolioRouter = router({
  // Get user's complete portfolio across all chains
  getPortfolio: protectedProcedure
    .input(z.object({
      userId: z.string(),
      chains: z.array(ChainIdSchema).optional()
    }))
    .query(async ({ ctx, input }) => {
      // Returns Portfolio[] with all positions and balances
    }),

  // Refresh portfolio data from blockchain
  refreshPortfolio: protectedProcedure
    .input(z.object({
      userId: z.string(),
      chainId: ChainIdSchema,
      forceRefresh: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Triggers RPC batching and cache updates
    }),

  // Get portfolio health analysis
  getHealthAnalysis: protectedProcedure
    .input(z.object({
      portfolioId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      // Returns health score, recommendations, risk analysis
    })
});

// Workflow Router
export const workflowRouter = router({
  // Plan cross-LP compounding workflow
  planCompounding: protectedProcedure
    .input(z.object({
      sourcePositions: z.array(z.string()),
      targetPosition: z.string().optional(),
      slippageTolerance: z.number().min(0.01).max(5.0)
    }))
    .mutation(async ({ ctx, input }) => {
      // Returns WorkflowExecution with simulated steps
    }),

  // Execute planned workflow
  executeWorkflow: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      stepId: z.string().optional() // For resuming failed workflows
    }))
    .mutation(async ({ ctx, input }) => {
      // Returns transaction data for current step
    }),

  // Get workflow execution history
  getWorkflowHistory: protectedProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(100).optional(),
      status: z.enum(['completed', 'failed', 'executing']).optional()
    }))
    .query(async ({ ctx, input }) => {
      // Returns WorkflowExecution[] with pagination
    })
});

// Main App Router
export const appRouter = router({
  portfolio: portfolioRouter,
  workflow: workflowRouter,
  // ... other routers
});

export type AppRouter = typeof appRouter;
```

## REST API Fallbacks

While tRPC handles most client-server communication, some REST endpoints are needed for external integrations:

```typescript
// Webhook endpoints for external services
POST /api/webhooks/price-updates     // CoinGecko/DefiLlama price notifications
POST /api/webhooks/transaction-status // Blockchain transaction confirmations

// Health check and monitoring
GET /api/health                      // System health status
GET /api/metrics                     // Application metrics for monitoring

// Public data endpoints (for potential future API consumers)
GET /api/public/protocols            // List of supported protocols
GET /api/public/chains               // Supported blockchain networks
```
