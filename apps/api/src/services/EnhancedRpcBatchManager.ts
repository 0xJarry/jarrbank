import { CachedRpcBatchManager } from './CachedRpcBatchManager';
import { RpcProviderManager } from '../../../../packages/web3/src/rpc/providers';
import { RedisCache } from '../db/redis';
import { ChainId } from '../../../../packages/shared/src/constants/chains';
import { BatchRequest, BatchResponse, RpcRequest } from './RpcBatchManager';

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

export class EnhancedRpcBatchManager extends CachedRpcBatchManager {
  private retryConfig: RetryConfig;
  private queueConfig: QueueConfig;
  private activeRequests: Map<ChainId, number> = new Map();
  private rateLimitStates: Map<string, RateLimitState> = new Map();
  private enhancedQueue: Map<ChainId, {
    requests: Array<{
      request: BatchRequest;
      resolve: (value: BatchResponse) => void;
      reject: (error: Error) => void;
    }>;
    processing: boolean;
  }> = new Map();

  constructor(
    providerManager: RpcProviderManager,
    cache: RedisCache,
    retryConfig?: Partial<RetryConfig>,
    queueConfig?: Partial<QueueConfig>
  ) {
    super(providerManager, cache);

    this.retryConfig = {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffFactor: 2,
      ...retryConfig
    };

    this.queueConfig = {
      maxConcurrency: 5,
      maxQueueSize: 1000,
      batchSize: 100,
      batchDelayMs: 50,
      ...queueConfig
    };
  }

  async batchCall(batchRequest: BatchRequest): Promise<BatchResponse> {
    const { chainId } = batchRequest;
    
    // Check queue capacity
    if (this.getQueueDepth(chainId) >= this.queueConfig.maxQueueSize) {
      throw new Error(`Queue for chain ${chainId} is full`);
    }

    return new Promise((resolve, reject) => {
      this.enqueueRequest(chainId, batchRequest, resolve, reject);
    });
  }

  private enqueueRequest(
    chainId: ChainId,
    request: BatchRequest,
    resolve: (value: BatchResponse) => void,
    reject: (error: Error) => void
  ): void {
    if (!this.enhancedQueue.has(chainId)) {
      this.enhancedQueue.set(chainId, {
        requests: [],
        processing: false
      });
    }

    const queue = this.enhancedQueue.get(chainId)!;
    queue.requests.push({ request, resolve, reject });

    if (!queue.processing) {
      this.processQueue(chainId);
    }
  }

  private async processQueue(chainId: ChainId): Promise<void> {
    const queue = this.enhancedQueue.get(chainId);
    if (!queue || queue.processing) {
      return;
    }

    queue.processing = true;

    try {
      while (queue.requests.length > 0) {
        // Check concurrency limits
        const activeCount = this.activeRequests.get(chainId) || 0;
        if (activeCount >= this.queueConfig.maxConcurrency) {
          await this.sleep(100);
          continue;
        }

        // Check rate limits
        if (await this.isRateLimited(chainId)) {
          await this.sleep(1000);
          continue;
        }

        const batchItems = queue.requests.splice(0, this.queueConfig.batchSize);
        
        this.incrementActiveRequests(chainId);
        
        // Process batch concurrently
        this.processBatch(chainId, batchItems).finally(() => {
          this.decrementActiveRequests(chainId);
        });

        // Small delay between batches
        if (queue.requests.length > 0) {
          await this.sleep(this.queueConfig.batchDelayMs);
        }
      }
    } finally {
      queue.processing = false;
    }
  }

  private async processBatch(
    chainId: ChainId,
    batchItems: Array<{
      request: BatchRequest;
      resolve: (value: BatchResponse) => void;
      reject: (error: Error) => void;
    }>
  ): Promise<void> {
    for (const { request, resolve, reject } of batchItems) {
      try {
        const response = await this.executeWithRetry(request);
        resolve(response);
      } catch (error) {
        reject(error as Error);
      }
    }
  }

  private async executeWithRetry(
    batchRequest: BatchRequest,
    attempt: number = 1
  ): Promise<BatchResponse> {
    try {
      return await super.batchCall(batchRequest);
    } catch (error) {
      if (attempt >= this.retryConfig.maxRetries) {
        throw error;
      }

      const isRetryableError = this.isRetryableError(error);
      if (!isRetryableError) {
        throw error;
      }

      const delay = this.calculateBackoffDelay(attempt);
      await this.sleep(delay);

      // Update rate limit state if it's a rate limit error
      if (this.isRateLimitError(error)) {
        this.updateRateLimitState(batchRequest.chainId, true);
      }

      return this.executeWithRetry(batchRequest, attempt + 1);
    }
  }

  private isRetryableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    
    // Network errors
    if (message.includes('network') || message.includes('timeout')) {
      return true;
    }
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }
    
    // Server errors (5xx)
    if (message.includes('502') || message.includes('503') || message.includes('504')) {
      return true;
    }

    return false;
  }

  private isRateLimitError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('rate limit') || message.includes('too many requests');
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return Math.min(delay + jitter, this.retryConfig.maxDelayMs);
  }

  private async isRateLimited(chainId: ChainId): Promise<boolean> {
    const provider = this.providerManager.getPrimaryProvider(chainId);
    const rateLimitState = this.rateLimitStates.get(provider.name);
    
    if (!rateLimitState) {
      return false;
    }

    if (Date.now() > rateLimitState.resetTime) {
      this.rateLimitStates.delete(provider.name);
      return false;
    }

    return rateLimitState.isLimited;
  }

  private updateRateLimitState(chainId: ChainId, isLimited: boolean): void {
    const provider = this.providerManager.getPrimaryProvider(chainId);
    
    this.rateLimitStates.set(provider.name, {
      requests: 0,
      resetTime: Date.now() + 60000, // Reset in 1 minute
      isLimited
    });
  }

  private incrementActiveRequests(chainId: ChainId): void {
    const current = this.activeRequests.get(chainId) || 0;
    this.activeRequests.set(chainId, current + 1);
  }

  private decrementActiveRequests(chainId: ChainId): void {
    const current = this.activeRequests.get(chainId) || 0;
    this.activeRequests.set(chainId, Math.max(0, current - 1));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getQueueDepth(chainId?: ChainId): number {
    if (chainId) {
      const queue = this.enhancedQueue.get(chainId);
      return queue?.requests.length || 0;
    }

    let total = 0;
    this.enhancedQueue.forEach(queue => {
      total += queue.requests.length;
    });
    return total;
  }

  getActiveRequestCount(chainId?: ChainId): number {
    if (chainId) {
      return this.activeRequests.get(chainId) || 0;
    }

    let total = 0;
    this.activeRequests.forEach(count => {
      total += count;
    });
    return total;
  }

  getRateLimitStatus(): Record<string, RateLimitState> {
    const status: Record<string, RateLimitState> = {};
    
    this.rateLimitStates.forEach((state, providerName) => {
      status[providerName] = { ...state };
    });
    
    return status;
  }

  getQueueStats(): {
    totalQueued: number;
    totalActive: number;
    queuesByChain: Record<ChainId, number>;
    rateLimits: Record<string, RateLimitState>;
  } {
    const queuesByChain: Record<ChainId, number> = {} as Record<ChainId, number>;
    
    this.enhancedQueue.forEach((queue, chainId) => {
      queuesByChain[chainId] = queue.requests.length;
    });

    return {
      totalQueued: this.getQueueDepth(),
      totalActive: this.getActiveRequestCount(),
      queuesByChain,
      rateLimits: this.getRateLimitStatus()
    };
  }

  updateQueueConfig(newConfig: Partial<QueueConfig>): void {
    this.queueConfig = { ...this.queueConfig, ...newConfig };
  }

  updateRetryConfig(newConfig: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...newConfig };
  }
}