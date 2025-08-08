import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { RedisCache } from '../db/redis';

export interface RateLimitConfig {
  global: {
    max: number;
    timeWindow: number;
  };
  rpc: {
    max: number;
    timeWindow: number;
  };
  endpoints: {
    [path: string]: {
      max: number;
      timeWindow: number;
    };
  };
}

export async function setupRateLimit(
  fastify: FastifyInstance,
  redisCache: RedisCache
): Promise<void> {
  const rateLimitConfig: RateLimitConfig = {
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
  await fastify.register(fastifyRateLimit, {
    global: false,
    max: rateLimitConfig.global.max,
    timeWindow: rateLimitConfig.global.timeWindow,
    redis: redisCache.getConnectionStatus() ? redisCache : undefined,
    keyGenerator: (request: FastifyRequest) => {
      return request.ip || 'anonymous';
    },
    errorResponseBuilder: (request: FastifyRequest, context: any) => {
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
      
      routeOptions.preHandler.push(
        async (request: FastifyRequest, reply: FastifyReply) => {
          const key = `ratelimit:${path}:${request.ip}`;
          // Custom rate limit logic for specific endpoints
        }
      );
    }
  });
}

export class RateLimitManager {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(key: string): Promise<boolean> {
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

  getRemainingRequests(key: string): number {
    const limit = this.limits.get(key);
    if (!limit || Date.now() > limit.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - limit.count);
  }

  getResetTime(key: string): number {
    const limit = this.limits.get(key);
    return limit?.resetTime || Date.now() + this.windowMs;
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  resetAll(): void {
    this.limits.clear();
  }
}