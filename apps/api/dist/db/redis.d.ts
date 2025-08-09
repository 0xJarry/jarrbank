import Redis from 'ioredis';
import { ChainId } from '../../../../packages/shared/src/constants/chains';
export interface CacheConfig {
    redisUrl: string;
    password?: string;
    ttl: {
        balance: number;
        metadata: number;
        blockNumber: number;
        tokenBalance: number;
        rpcResponse: number;
    };
}
export interface CachedData<T = any> {
    data: T;
    timestamp: number;
    ttl: number;
    chainId?: ChainId;
}
export declare class RedisCache {
    private client;
    private config;
    private isConnected;
    constructor(config: CacheConfig);
    private generateCacheKey;
    getCachedData<T>(key: string): Promise<CachedData<T> | null>;
    setCachedData<T>(key: string, data: T, ttlSeconds?: number, chainId?: ChainId): Promise<void>;
    getCachedBalance(chainId: ChainId, address: string): Promise<bigint | null>;
    setCachedBalance(chainId: ChainId, address: string, balance: bigint): Promise<void>;
    getCachedTokenBalance(chainId: ChainId, tokenAddress: string, walletAddress: string): Promise<bigint | null>;
    setCachedTokenBalance(chainId: ChainId, tokenAddress: string, walletAddress: string, balance: bigint): Promise<void>;
    getCachedBlockNumber(chainId: ChainId): Promise<bigint | null>;
    setCachedBlockNumber(chainId: ChainId, blockNumber: bigint): Promise<void>;
    getCachedMetadata(chainId: ChainId, tokenAddress: string): Promise<any | null>;
    setCachedMetadata(chainId: ChainId, tokenAddress: string, metadata: any): Promise<void>;
    invalidateCache(pattern: string): Promise<void>;
    invalidateBalanceCache(chainId?: ChainId, address?: string): Promise<void>;
    flushAll(): Promise<void>;
    ping(): Promise<boolean>;
    getConnectionStatus(): boolean;
    disconnect(): Promise<void>;
    getCacheStats(): {
        connected: boolean;
        ttlConfig: CacheConfig['ttl'];
    };
}
export declare function getRedisClient(): Redis;
