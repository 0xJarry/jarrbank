"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedRpcBatchManager = void 0;
const CachedRpcBatchManager_1 = require("./CachedRpcBatchManager");
class EnhancedRpcBatchManager extends CachedRpcBatchManager_1.CachedRpcBatchManager {
    retryConfig;
    queueConfig;
    activeRequests = new Map();
    rateLimitStates = new Map();
    enhancedQueue = new Map();
    constructor(providerManager, cache, retryConfig, queueConfig) {
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
    async batchCall(batchRequest) {
        const { chainId } = batchRequest;
        // Check queue capacity
        if (this.getQueueDepth(chainId) >= this.queueConfig.maxQueueSize) {
            throw new Error(`Queue for chain ${chainId} is full`);
        }
        return new Promise((resolve, reject) => {
            this.enqueueRequest(chainId, batchRequest, resolve, reject);
        });
    }
    enqueueRequest(chainId, request, resolve, reject) {
        if (!this.enhancedQueue.has(chainId)) {
            this.enhancedQueue.set(chainId, {
                requests: [],
                processing: false
            });
        }
        const queue = this.enhancedQueue.get(chainId);
        queue.requests.push({ request, resolve, reject });
        if (!queue.processing) {
            this.processQueue(chainId);
        }
    }
    async processQueue(chainId) {
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
        }
        finally {
            queue.processing = false;
        }
    }
    async processBatch(chainId, batchItems) {
        for (const { request, resolve, reject } of batchItems) {
            try {
                const response = await this.executeWithRetry(request);
                resolve(response);
            }
            catch (error) {
                reject(error);
            }
        }
    }
    async executeWithRetry(batchRequest, attempt = 1) {
        try {
            return await super.batchCall(batchRequest);
        }
        catch (error) {
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
    isRetryableError(error) {
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
    isRateLimitError(error) {
        const message = error?.message?.toLowerCase() || '';
        return message.includes('rate limit') || message.includes('too many requests');
    }
    calculateBackoffDelay(attempt) {
        const delay = this.retryConfig.baseDelayMs * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        return Math.min(delay + jitter, this.retryConfig.maxDelayMs);
    }
    async isRateLimited(chainId) {
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
    updateRateLimitState(chainId, isLimited) {
        const provider = this.providerManager.getPrimaryProvider(chainId);
        this.rateLimitStates.set(provider.name, {
            requests: 0,
            resetTime: Date.now() + 60000, // Reset in 1 minute
            isLimited
        });
    }
    incrementActiveRequests(chainId) {
        const current = this.activeRequests.get(chainId) || 0;
        this.activeRequests.set(chainId, current + 1);
    }
    decrementActiveRequests(chainId) {
        const current = this.activeRequests.get(chainId) || 0;
        this.activeRequests.set(chainId, Math.max(0, current - 1));
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getQueueDepth(chainId) {
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
    getActiveRequestCount(chainId) {
        if (chainId) {
            return this.activeRequests.get(chainId) || 0;
        }
        let total = 0;
        this.activeRequests.forEach(count => {
            total += count;
        });
        return total;
    }
    getRateLimitStatus() {
        const status = {};
        this.rateLimitStates.forEach((state, providerName) => {
            status[providerName] = { ...state };
        });
        return status;
    }
    getQueueStats() {
        const queuesByChain = {};
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
    updateQueueConfig(newConfig) {
        this.queueConfig = { ...this.queueConfig, ...newConfig };
    }
    updateRetryConfig(newConfig) {
        this.retryConfig = { ...this.retryConfig, ...newConfig };
    }
}
exports.EnhancedRpcBatchManager = EnhancedRpcBatchManager;
//# sourceMappingURL=EnhancedRpcBatchManager.js.map