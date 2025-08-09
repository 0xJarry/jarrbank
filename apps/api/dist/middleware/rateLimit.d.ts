import { FastifyInstance } from 'fastify';
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
export declare function setupRateLimit(fastify: FastifyInstance, redisCache: RedisCache): Promise<void>;
export declare class RateLimitManager {
    private limits;
    private maxRequests;
    private windowMs;
    constructor(maxRequests?: number, windowMs?: number);
    checkLimit(key: string): Promise<boolean>;
    getRemainingRequests(key: string): number;
    getResetTime(key: string): number;
    reset(key: string): void;
    resetAll(): void;
}
