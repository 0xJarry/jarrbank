# Backend Architecture

Define backend-specific architecture details based on the Fastify framework, tRPC API design, and serverless deployment approach on Railway, optimized for complex DeFi data processing and workflow automation.

## Service Architecture

### Function Organization

```text
apps/api/src/
├── server.ts                 # Fastify server entry point
├── routers/                  # tRPC router modules
│   ├── portfolio.ts         # Portfolio data aggregation
│   ├── lpPosition.ts        # LP position tracking
│   ├── workflow.ts          # Workflow automation
│   ├── token.ts            # Token data and pricing
│   ├── analytics.ts        # Health analytics
│   ├── user.ts            # User preferences
│   └── protocol.ts         # Protocol integrations
├── services/               # Business logic layer
│   ├── RpcBatchManager.ts  # Blockchain RPC batching
│   ├── PortfolioAggregator.ts # Portfolio data synthesis
│   ├── WorkflowEngine.ts   # Multi-step workflow orchestration
│   ├── HealthCalculator.ts # Portfolio health scoring
│   ├── PriceService.ts     # Multi-provider price data
│   └── NotificationService.ts # Real-time notifications
├── adapters/               # External service adapters
│   ├── protocols/          # DEX protocol adapters
│   │   ├── UniswapAdapter.ts
│   │   ├── TraderJoeAdapter.ts
│   │   ├── PharaohAdapter.ts
│   │   └── BlackholeAdapter.ts
│   ├── providers/          # Price data providers
│   │   ├── MoralisProvider.ts
│   │   ├── DefiLlamaProvider.ts
│   │   └── CoinMarketCapProvider.ts
│   └── blockchain/         # RPC providers
│       ├── AlchemyProvider.ts
│       ├── InfuraProvider.ts
│       └── BaseRpcProvider.ts
├── middleware/             # Request processing middleware
├── utils/                  # Shared utilities
├── types/                  # TypeScript definitions
└── db/                    # Database layer
    ├── client.ts          # Supabase client
    ├── migrations/        # Schema migrations
    └── seeds/            # Development data
```

### Server Template

```typescript
// Fastify server with tRPC integration
import Fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createContext } from './context';
import { appRouter } from './router';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  },
  maxParamLength: 5000 // Support long wallet addresses and transaction hashes
});

// Security middleware
await server.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https://api.coingecko.com", "https://api.llama.fi"]
    }
  }
});

await server.register(cors, {
  origin: process.env.FRONTEND_URL,
  credentials: true
});

// Rate limiting for DeFi API protection
await server.register(rateLimit, {
  max: 100, // requests
  timeWindow: '1 minute',
  keyGenerator: (req) => req.headers.authorization || req.ip,
  errorResponseBuilder: (req, context) => ({
    code: 'RATE_LIMIT_EXCEEDED',
    error: 'Too many requests',
    message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
    retryAfter: Math.round(context.ttl / 1000)
  })
});

// tRPC integration
await server.register(fastifyTRPCPlugin, {
  prefix: '/api/trpc',
  trpcOptions: { 
    router: appRouter, 
    createContext,
    onError({ path, error, type, ctx }) {
      // Enhanced error logging for DeFi operations
      server.log.error({
        path,
        type,
        error: error.message,
        code: error.code,
        userId: ctx?.user?.id,
        stack: error.stack
      }, 'tRPC error');
    }
  }
});

// Health check endpoint for Railway deployment
server.get('/health', async (request, reply) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      rpc: await checkRpcHealth()
    }
  };
  
  const allHealthy = Object.values(health.services).every(s => s.status === 'healthy');
  reply.code(allHealthy ? 200 : 503).send(health);
});

const start = async () => {
  try {
    const host = process.env.HOST || '0.0.0.0';
    const port = Number(process.env.PORT) || 3001;
    
    await server.listen({ host, port });
    server.log.info(`🚀 JarrBank API server listening on ${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

## Database Architecture

### Data Access Layer

```typescript
// Repository pattern implementation
import { supabase } from '../db/client';
import type { Portfolio, TokenBalance, LPPosition } from '../types/portfolio';

export class PortfolioRepository {
  async getPortfoliosByUser(userId: string, chainIds?: number[]): Promise<Portfolio[]> {
    let query = supabase
      .from('portfolios')
      .select(`
        *,
        token_balances (
          *,
          token_metadata (*)
        ),
        lp_positions (
          *,
          protocols (*),
          lp_position_performance (*)
        )
      `)
      .eq('user_id', userId);
    
    if (chainIds) {
      query = query.in('chain_id', chainIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new DatabaseError(`Failed to fetch portfolios: ${error.message}`);
    }
    
    return data.map(this.mapPortfolioFromDb);
  }
  
  async updatePortfolioHealth(portfolioId: string, healthScore: number): Promise<void> {
    const { error } = await supabase
      .from('portfolios')
      .update({ 
        health_score: healthScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId);
    
    if (error) {
      throw new DatabaseError(`Failed to update portfolio health: ${error.message}`);
    }
  }
  
  private mapPortfolioFromDb(dbPortfolio: any): Portfolio {
    return {
      id: dbPortfolio.id,
      userId: dbPortfolio.user_id,
      chainId: dbPortfolio.chain_id,
      totalValue: BigInt(dbPortfolio.total_value_usd),
      healthScore: dbPortfolio.health_score,
      lastSyncedAt: new Date(dbPortfolio.last_synced_at),
      composition: dbPortfolio.composition || [],
      tokens: dbPortfolio.token_balances?.map(this.mapTokenBalanceFromDb) || [],
      lpPositions: dbPortfolio.lp_positions?.map(this.mapLPPositionFromDb) || []
    };
  }
}
```

## Authentication and Authorization

### Auth Flow Implementation

```typescript
// JWT-based authentication with Supabase Auth
import { createMiddleware } from '@trpc/server/adapters/fastify';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/client';

export interface AuthContext {
  user: {
    id: string;
    walletAddress: string;
    connectedWallets: string[];
  } | null;
}

export const createContext = async ({ req }: { req: FastifyRequest }): Promise<AuthContext> => {
  // Extract JWT from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    return { user: null };
  }
  
  try {
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null };
    }
    
    // Fetch user data from our database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userError || !userData) {
      return { user: null };
    }
    
    return {
      user: {
        id: userData.id,
        walletAddress: userData.primary_wallet_address,
        connectedWallets: userData.connected_wallets
      }
    };
  } catch (error) {
    return { user: null };
  }
};
```

### Middleware/Guards

```typescript
// tRPC middleware for authentication and authorization
import { TRPCError } from '@trpc/server';
import { middleware, publicProcedure } from '../trpc';

// Authentication middleware
const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Authentication required' 
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});

// Wallet ownership verification for sensitive operations
const verifyWalletOwnership = middleware(async ({ ctx, input, next }) => {
  const { walletAddress } = input as { walletAddress: string };
  
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  const ownsWallet = ctx.user.walletAddress === walletAddress || 
                   ctx.user.connectedWallets.includes(walletAddress);
  
  if (!ownsWallet) {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Wallet access denied' 
    });
  }
  
  return next({ ctx });
});

// Create protected procedures with different authorization levels
export const protectedProcedure = publicProcedure.use(isAuthenticated);
export const walletVerifiedProcedure = protectedProcedure.use(verifyWalletOwnership);
```
