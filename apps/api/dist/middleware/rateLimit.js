"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitManager = void 0;
exports.setupRateLimit = setupRateLimit;
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
async function setupRateLimit(fastify, redisCache) {
    const rateLimitConfig = {
        global: {
            max: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
            timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000')
        },
        rpc: {
            max: parseInt(process.env.RPC_RATE_LIMIT_MAX || '100'),
            timeWindow: parseInt(process.env.RPC_RATE_LIMIT_WINDOW || '60000')
        },
        endpoints: {
            '/api/rpc/batch': {
                max: 50,
                timeWindow: 60000
            },
            '/api/portfolio': {
                max: 100,
                timeWindow: 60000
            },
            '/health': {
                max: 1000,
                timeWindow: 60000
            }
        }
    };
    // Global rate limiting
    await fastify.register(rate_limit_1.default, {
        global: false,
        max: rateLimitConfig.global.max,
        timeWindow: rateLimitConfig.global.timeWindow,
        redis: redisCache.getConnectionStatus() ? redisCache : undefined,
        keyGenerator: (request) => {
            return request.ip || 'anonymous';
        },
        errorResponseBuilder: (request, context) => {
            return {
                error: 'Too Many Requests',
                message: `Rate limit exceeded, retry in ${Math.ceil(context.ttl / 1000)} seconds`,
                statusCode: 429,
                retryAfter: context.ttl
            };
        }
    });
    // Apply endpoint-specific rate limits
    fastify.addHook('onRoute', (routeOptions) => {
        const path = routeOptions.path;
        const endpointConfig = rateLimitConfig.endpoints[path];
        if (endpointConfig) {
            routeOptions.preHandler = Array.isArray(routeOptions.preHandler)
                ? routeOptions.preHandler
                : routeOptions.preHandler
                    ? [routeOptions.preHandler]
                    : [];
            routeOptions.preHandler.push(async (request, reply) => {
                const key = `ratelimit:${path}:${request.ip}`;
                // Custom rate limit logic for specific endpoints
            });
        }
    });
}
class RateLimitManager {
    limits = new Map();
    maxRequests;
    windowMs;
    constructor(maxRequests = 100, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    async checkLimit(key) {
        const now = Date.now();
        const limit = this.limits.get(key);
        if (!limit || now > limit.resetTime) {
            this.limits.set(key, {
                count: 1,
                resetTime: now + this.windowMs
            });
            return true;
        }
        if (limit.count >= this.maxRequests) {
            return false;
        }
        limit.count++;
        return true;
    }
    getRemainingRequests(key) {
        const limit = this.limits.get(key);
        if (!limit || Date.now() > limit.resetTime) {
            return this.maxRequests;
        }
        return Math.max(0, this.maxRequests - limit.count);
    }
    getResetTime(key) {
        const limit = this.limits.get(key);
        return limit?.resetTime || Date.now() + this.windowMs;
    }
    reset(key) {
        this.limits.delete(key);
    }
    resetAll() {
        this.limits.clear();
    }
}
exports.RateLimitManager = RateLimitManager;
//# sourceMappingURL=rateLimit.js.map