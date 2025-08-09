"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.createServer = createServer;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const fastify_2 = require("@trpc/server/adapters/fastify");
const providers_1 = require("../../../packages/web3/src/rpc/providers");
const redis_1 = require("./db/redis");
const EnhancedRpcBatchManager_1 = require("./services/EnhancedRpcBatchManager");
const RpcErrorHandler_1 = require("./services/RpcErrorHandler");
const rateLimit_1 = require("./middleware/rateLimit");
const chains_1 = require("../../../packages/shared/src/constants/chains");
const routers_1 = require("./routers");
const portfolio_router_1 = require("./routers/portfolio.router");
require("dotenv/config");
// Configuration from environment variables
const config = {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || '0.0.0.0',
    rpc: {
        alchemy: {
            ethRpcUrl: process.env.ALCHEMY_ETH_RPC_URL,
            arbRpcUrl: process.env.ALCHEMY_ARB_RPC_URL,
            avaxRpcUrl: process.env.ALCHEMY_AVAX_RPC_URL,
        },
        infura: {
            projectId: process.env.INFURA_PROJECT_ID,
            projectSecret: process.env.INFURA_PROJECT_SECRET,
        },
        rateLimit: {
            maxRequests: parseInt(process.env.RPC_RATE_LIMIT_MAX || '100'),
            windowMs: parseInt(process.env.RPC_RATE_LIMIT_WINDOW || '60000'),
        }
    },
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
    }
};
exports.config = config;
// Validate required environment variables
function validateConfig() {
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
let rpcManager;
let redisCache;
let errorHandler;
let errorMetrics;
async function createServer() {
    const fastify = (0, fastify_1.default)({
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
    await fastify.register(cors_1.default, {
        origin: process.env.NODE_ENV === 'development' ? true : false,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    });
    await (0, rateLimit_1.setupRateLimit)(fastify, redisCache);
    // Register tRPC
    await fastify.register(fastify_2.fastifyTRPCPlugin, {
        prefix: '/trpc',
        trpcOptions: { router: routers_1.appRouter }
    });
    // Register routes
    await registerRoutes(fastify);
    return fastify;
}
async function initializeServices() {
    console.log('🚀 Initializing services...');
    // Initialize Redis cache
    redisCache = new redis_1.RedisCache(config.cache);
    // Initialize RPC provider manager
    const providerManager = new providers_1.RpcProviderManager(config.rpc);
    // Initialize error handling
    errorHandler = new RpcErrorHandler_1.ChainSpecificErrorHandler();
    errorMetrics = new RpcErrorHandler_1.ErrorMetricsCollector();
    // Initialize enhanced RPC batch manager
    rpcManager = new EnhancedRpcBatchManager_1.EnhancedRpcBatchManager(providerManager, redisCache, {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        backoffFactor: 2
    }, {
        maxConcurrency: 5,
        maxQueueSize: 1000,
        batchSize: 100,
        batchDelayMs: 50
    });
    // Initialize portfolio services
    (0, portfolio_router_1.initializePortfolioServices)(providerManager);
    console.log('✅ Services initialized successfully');
}
async function registerRoutes(fastify) {
    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
        const startTime = Date.now();
        try {
            // Test Redis connection
            const redisHealthy = await redisCache.ping();
            // Test RPC connectivity for all chains
            const rpcHealth = await Promise.all([
                testRpcConnection(chains_1.CHAIN_IDS.ETHEREUM),
                testRpcConnection(chains_1.CHAIN_IDS.ARBITRUM),
                testRpcConnection(chains_1.CHAIN_IDS.AVALANCHE)
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
                            const chainIds = [chains_1.CHAIN_IDS.ETHEREUM, chains_1.CHAIN_IDS.ARBITRUM, chains_1.CHAIN_IDS.AVALANCHE];
                            acc[chainIds[index]] = result;
                            return acc;
                        }, {})
                    }
                },
                metrics: {
                    queue: rpcManager.getQueueStats(),
                    errors: errorMetrics.getMetrics()
                }
            };
            const statusCode = health.status === 'healthy' ? 200 : 503;
            reply.code(statusCode).send(health);
        }
        catch (error) {
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
            const { chainId, requests } = request.body;
            if (!chainId || !requests || !Array.isArray(requests)) {
                return reply.code(400).send({
                    error: 'Invalid request',
                    message: 'chainId and requests array are required'
                });
            }
            const response = await rpcManager.batchCall({ chainId, requests });
            reply.send(response);
        }
        catch (error) {
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
            const { chainId, address } = request.params;
            const chainIdNum = parseInt(chainId);
            const balances = await rpcManager.getMultipleBalances(chainIdNum, [address]);
            reply.send({
                chainId: chainIdNum,
                address,
                balance: balances[address]?.toString() || '0',
                cached: true // Will be false if fetched fresh
            });
        }
        catch (error) {
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
async function testRpcConnection(chainId) {
    const startTime = Date.now();
    try {
        const blockNumbers = await rpcManager.getMultipleBlockNumbers([chainId]);
        const blockNumber = blockNumbers[chainId];
        return {
            healthy: true,
            responseTime: Date.now() - startTime,
            provider: 'primary',
            blockNumber: blockNumber?.toString()
        };
    }
    catch (error) {
        return {
            healthy: false,
            responseTime: Date.now() - startTime,
            provider: 'primary',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function startServer() {
    try {
        validateConfig();
        const server = await createServer();
        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            console.log(`\n📶 Received ${signal}, shutting down gracefully...`);
            try {
                await rpcManager.flushAllQueues();
                await redisCache.disconnect();
                await server.close();
                console.log('✅ Server shutdown completed');
                process.exit(0);
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Start server if run directly
if (require.main === module) {
    startServer();
}
//# sourceMappingURL=server.js.map