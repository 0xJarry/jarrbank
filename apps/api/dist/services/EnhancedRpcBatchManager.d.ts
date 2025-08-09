import { CachedRpcBatchManager } from './CachedRpcBatchManager';
import { RpcProviderManager } from '../../../../packages/web3/src/rpc/providers';
import { RedisCache } from '../db/redis';
import { ChainId } from '../../../../packages/shared/src/constants/chains';
import { BatchRequest, BatchResponse } from './RpcBatchManager';
export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
}
export interface QueueConfig {
    maxConcurrency: number;
    maxQueueSize: number;
    batchSize: number;
    batchDelayMs: number;
}
export interface RateLimitState {
    requests: number;
    resetTime: number;
    isLimited: boolean;
}
export declare class EnhancedRpcBatchManager extends CachedRpcBatchManager {
    private retryConfig;
    private queueConfig;
    private activeRequests;
    private rateLimitStates;
    private enhancedQueue;
    constructor(providerManager: RpcProviderManager, cache: RedisCache, retryConfig?: Partial<RetryConfig>, queueConfig?: Partial<QueueConfig>);
    batchCall(batchRequest: BatchRequest): Promise<BatchResponse>;
    private enqueueRequest;
    private processQueue;
    private processBatch;
    private executeWithRetry;
    private isRetryableError;
    private isRateLimitError;
    private calculateBackoffDelay;
    private isRateLimited;
    private updateRateLimitState;
    private incrementActiveRequests;
    private decrementActiveRequests;
    private sleep;
    getQueueDepth(chainId?: ChainId): number;
    getActiveRequestCount(chainId?: ChainId): number;
    getRateLimitStatus(): Record<string, RateLimitState>;
    getQueueStats(): {
        totalQueued: number;
        totalActive: number;
        queuesByChain: Record<ChainId, number>;
        rateLimits: Record<string, RateLimitState>;
    };
    updateQueueConfig(newConfig: Partial<QueueConfig>): void;
    updateRetryConfig(newConfig: Partial<RetryConfig>): void;
}
