import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { RpcProviderManager, RpcConfig } from '../../../packages/web3/src/rpc/providers';
import { RedisCache, CacheConfig } from './db/redis';
import { EnhancedRpcBatchManager } from './services/EnhancedRpcBatchManager';
import { ChainSpecificErrorHandler, ErrorMetricsCollector } from './services/RpcErrorHandler';
import { setupRateLimit } from './middleware/rateLimit';
import { CHAIN_IDS, ChainId } from '../../../packages/shared/src/constants/chains';
import { appRouter } from './routers';
import { initializePortfolioServices } from './routers/portfolio.router';
import 'dotenv/config';

// Configuration from environment variables
const config = {
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || '0.0.0.0',
  
  rpc: {
    alchemy: {
      ethRpcUrl: process.env.ALCHEMY_ETH_RPC_URL!,
      arbRpcUrl: process.env.ALCHEMY_ARB_RPC_URL!,
      avaxRpcUrl: process.env.ALCHEMY_AVAX_RPC_URL!,
    },
    infura: {
      projectId: process.env.INFURA_PROJECT_ID!,
      projectSecret: process.env.INFURA_PROJECT_SECRET,
    },
    rateLimit: {
      maxRequests: parseInt(process.env.RPC_RATE_LIMIT_MAX || '100'),
      windowMs: parseInt(process.env.RPC_RATE_LIMIT_WINDOW || '60000'),
    }
  } as RpcConfig,
  
  cache: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    ttl: {
      balance: parseInt(process.env.CACHE_TTL_BALANCE || '30'),
      metadata: parseInt(process.env.CACHE_TTL_METADATA || '3600'),
      blockNumber: 10,
      tokenBalance: 30,
      rpcResponse: 60,
    }
  } as CacheConfig
};

// Validate required environment variables
function validateConfig(): void {
  const required = [
    'ALCHEMY_ETH_RPC_URL',
    'ALCHEMY_ARB_RPC_URL', 
    'ALCHEMY_AVAX_RPC_URL',
    'INFURA_PROJECT_ID'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check your .env file and ensure all RPC provider credentials are set.');
    process.exit(1);
  }
}

// Global services
let rpcManager: EnhancedRpcBatchManager;
let redisCache: RedisCache;
let errorHandler: ChainSpecificErrorHandler;
let errorMetrics: ErrorMetricsCollector;

async function createServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      } : undefined
    }
  });

  // Initialize services
  await initializeServices();

  // Register plugins
  await fastify.register(cors, {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://jarrbank.vercel.app',
        process.env.FRONTEND_URL
      ].filter(Boolean);
      
      // Allow requests with no origin (e.g., Postman, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Check if origin is allowed
      if (process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  await setupRateLimit(fastify, redisCache);

  // Register tRPC
  await fastify.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router: appRouter }
  });

  // Register routes
  await registerRoutes(fastify);

  return fastify;
}

async function initializeServices(): Promise<void> {
  console.log('🚀 Initializing services...');

  // Initialize Redis cache
  redisCache = new RedisCache(config.cache);
  
  // Initialize RPC provider manager
  const providerManager = new RpcProviderManager(config.rpc);
  
  // Initialize error handling
  errorHandler = new ChainSpecificErrorHandler();
  errorMetrics = new ErrorMetricsCollector();
  
  // Initialize enhanced RPC batch manager
  rpcManager = new EnhancedRpcBatchManager(
    providerManager,
    redisCache,
    {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffFactor: 2
    },
    {
      maxConcurrency: 5,
      maxQueueSize: 1000,
      batchSize: 100,
      batchDelayMs: 50
    }
  );

  // Initialize portfolio services
  initializePortfolioServices(providerManager);

  console.log('✅ Services initialized successfully');
}

async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    const startTime = Date.now();
    
    try {
      // Test Redis connection
      const redisHealthy = await redisCache.ping();
      
      // Test RPC connectivity for all chains
      const rpcHealth = await Promise.all([
        testRpcConnection(CHAIN_IDS.ETHEREUM),
        testRpcConnection(CHAIN_IDS.ARBITRUM),
        testRpcConnection(CHAIN_IDS.AVALANCHE)
      ]);
      
      const allRpcHealthy = rpcHealth.every(result => result.healthy);
      const responseTime = Date.now() - startTime;
      
      const health = {
        status: redisHealthy && allRpcHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime,
        services: {
          redis: {
            status: redisHealthy ? 'healthy' : 'unhealthy',
            connected: redisCache.getConnectionStatus()
          },
          rpc: {
            status: allRpcHealthy ? 'healthy' : 'degraded',
            chains: rpcHealth.reduce((acc, result, index) => {
              const chainIds = [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM, CHAIN_IDS.AVALANCHE];
              acc[chainIds[index]] = result;
              return acc;
            }, {} as Record<number, any>)
          }
        },
        metrics: {
          queue: rpcManager.getQueueStats(),
          errors: errorMetrics.getMetrics()
        }
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;
      reply.code(statusCode).send(health);
    } catch (error) {
      const errorResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
      
      reply.code(503).send(errorResponse);
    }
  });

  // RPC batch endpoint
  fastify.post('/api/rpc/batch', async (request, reply) => {
    try {
      const { chainId, requests } = request.body as any;
      
      if (!chainId || !requests || !Array.isArray(requests)) {
        return reply.code(400).send({
          error: 'Invalid request',
          message: 'chainId and requests array are required'
        });
      }

      const response = await rpcManager.batchCall({ chainId, requests });
      reply.send(response);
    } catch (error) {
      fastify.log.error('RPC batch call failed: %s', error instanceof Error ? error.message : String(error));
      reply.code(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Balance endpoint with caching
  fastify.get('/api/balances/:chainId/:address', async (request, reply) => {
    try {
      const { chainId, address } = request.params as any;
      const chainIdNum = parseInt(chainId);

      const balances = await rpcManager.getMultipleBalances(chainIdNum as ChainId, [address]);
      
      reply.send({
        chainId: chainIdNum,
        address,
        balance: balances[address]?.toString() || '0',
        cached: true // Will be false if fetched fresh
      });
    } catch (error) {
      fastify.log.error('Balance fetch failed: %s', error instanceof Error ? error.message : String(error));
      reply.code(500).send({
        error: 'Failed to fetch balance',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Queue stats endpoint
  fastify.get('/api/stats/queue', async (request, reply) => {
    const stats = rpcManager.getQueueStats();
    reply.send(stats);
  });

  // Error metrics endpoint  
  fastify.get('/api/stats/errors', async (request, reply) => {
    const metrics = errorMetrics.getMetrics();
    reply.send(metrics);
  });
}

async function testRpcConnection(chainId: number): Promise<{
  healthy: boolean;
  responseTime: number;
  provider: string;
  blockNumber?: string;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const blockNumbers = await rpcManager.getMultipleBlockNumbers([chainId as ChainId]);
    const blockNumber = blockNumbers[chainId as ChainId];
    
    return {
      healthy: true,
      responseTime: Date.now() - startTime,
      provider: 'primary',
      blockNumber: blockNumber?.toString()
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      provider: 'primary',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function startServer(): Promise<void> {
  try {
    validateConfig();
    
    const server = await createServer();
    
    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📶 Received ${signal}, shutting down gracefully...`);
      
      try {
        await rpcManager.flushAllQueues();
        await redisCache.disconnect();
        await server.close();
        console.log('✅ Server shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Start server
    await server.listen({ 
      port: config.port, 
      host: config.host 
    });

    console.log(`🚀 Server running on http://${config.host}:${config.port}`);
    console.log(`📊 Health check: http://${config.host}:${config.port}/health`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if run directly
if (require.main === module) {
  startServer();
}

export { createServer, config };