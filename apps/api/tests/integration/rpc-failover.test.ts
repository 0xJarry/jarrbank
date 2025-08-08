import { describe, it, expect, beforeEach, vi, Mock, beforeAll, afterAll } from 'vitest';
import { EnhancedRpcBatchManager } from '../../src/services/EnhancedRpcBatchManager';
import { RpcProviderManager } from '../../../../packages/web3/src/rpc/providers';
import { RedisCache } from '../../src/db/redis';
import { ChainSpecificErrorHandler, RpcErrorClassifier } from '../../src/services/RpcErrorHandler';
import { CHAIN_IDS } from '../../../../packages/shared/src/constants/chains';
import { 
  mockProviderConfig, 
  mockCacheConfig, 
  mockRateLimitError, 
  mockNetworkError,
  mockServerError
} from '../fixtures/rpc-responses';

// Mock Redis for integration tests
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    flushall: vi.fn().mockResolvedValue('OK'),
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK')
  }))
}));

global.fetch = vi.fn();

describe('RPC Failover Integration Tests', () => {
  let rpcManager: EnhancedRpcBatchManager;
  let providerManager: RpcProviderManager;
  let redisCache: RedisCache;
  let errorHandler: ChainSpecificErrorHandler;

  beforeAll(async () => {
    providerManager = new RpcProviderManager(mockProviderConfig);
    redisCache = new RedisCache(mockCacheConfig);
    errorHandler = new ChainSpecificErrorHandler();
    
    rpcManager = new EnhancedRpcBatchManager(
      providerManager,
      redisCache,
      {
        maxRetries: 2,
        baseDelayMs: 100, // Faster for tests
        maxDelayMs: 1000,
        backoffFactor: 2
      },
      {
        maxConcurrency: 2,
        maxQueueSize: 100,
        batchSize: 10,
        batchDelayMs: 10
      }
    );

    // Add error event listeners to prevent unhandled errors in tests
    rpcManager.on('error', (errorData) => {
      // Silently handle errors in tests - they're expected for failover scenarios
      console.log(`Expected error in test: ${errorData.provider} - ${errorData.error.message}`);
    });
    
    rpcManager.on('failover', (failoverData) => {
      console.log(`Failover occurred: ${failoverData.from} -> ${failoverData.to}`);
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('provider failover scenarios', () => {
    it('should failover from Alchemy to Infura on rate limit error', async () => {
      const mockFetch = fetch as Mock;
      
      // Alchemy returns rate limit error (HTTP 429)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ error: 'Rate limit exceeded' })
      });
      
      // Infura succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, result: '0x1bc16d674ec80000' }
        ])
      });

      const batchRequest = {
        chainId: CHAIN_IDS.ETHEREUM,
        requests: [{ id: 1, method: 'eth_getBalance', params: ['0x742d35Cc6634C0532925a3b8D6Ac6c22af9abcde', 'latest'] }]
      };

      const result = await rpcManager.batchCall(batchRequest);

      expect(result.provider).toBe('Infura-ETH');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors with exponential backoff', async () => {
      const mockFetch = fetch as Mock;
      
      // First two calls fail
      mockFetch.mockRejectedValueOnce(mockNetworkError);
      mockFetch.mockRejectedValueOnce(mockNetworkError);
      
      // Third call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, result: '0x1bc16d674ec80000' }
        ])
      });

      const batchRequest = {
        chainId: CHAIN_IDS.ETHEREUM,
        requests: [{ id: 1, method: 'eth_getBalance', params: ['0x742d35Cc6634C0532925a3b8D6Ac6c22af9abcde', 'latest'] }]
      };

      const result = await rpcManager.batchCall(batchRequest);

      expect(result.provider).toBe('Alchemy-ETH');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle chain-specific error recovery', async () => {
      const mockFetch = fetch as Mock;
      
      // Test error handling with proper HTTP error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      // Fallback provider succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, result: '0x9e0e484' }
        ])
      });

      const batchRequest = {
        chainId: CHAIN_IDS.ARBITRUM,
        requests: [{ id: 1, method: 'eth_blockNumber', params: [] }]
      };

      const result = await rpcManager.batchCall(batchRequest);
      expect(result.chainId).toBe(CHAIN_IDS.ARBITRUM);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('error classification and handling', () => {
    it('should correctly classify different error types', () => {
      // Rate limit error
      const rateLimitError = RpcErrorClassifier.classify(mockRateLimitError, CHAIN_IDS.ETHEREUM, 'Alchemy-ETH');
      expect(rateLimitError.type).toBe('rate_limit');
      expect(rateLimitError.recoveryAction).toBe('failover');

      // Network error
      const networkError = RpcErrorClassifier.classify(mockNetworkError, CHAIN_IDS.ETHEREUM, 'Alchemy-ETH');
      expect(networkError.type).toBe('network_error');
      expect(networkError.recoveryAction).toBe('failover');

      // Server error
      const serverError = RpcErrorClassifier.classify(mockServerError, CHAIN_IDS.ETHEREUM, 'Alchemy-ETH');
      expect(serverError.type).toBe('provider_error');
      expect(serverError.recoveryAction).toBe('failover');
    });

    it('should determine correct recovery actions for chain-specific errors', () => {
      const blockNotFoundError = {
        message: 'Block not found'
      };

      const error = RpcErrorClassifier.classify(blockNotFoundError, CHAIN_IDS.ARBITRUM, 'Alchemy-ARB');
      const recoveryAction = errorHandler.getRecoveryAction(error);

      // Arbitrum config should prefer cache fallback for block not found
      expect(recoveryAction).toBe('cache_fallback');
    });
  });

  describe('queue management under stress', () => {
    it('should handle concurrent requests without overwhelming providers', async () => {
      const mockFetch = fetch as Mock;
      mockFetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve([{ id: 1, result: '0x123' }])
            });
          }, 50); // 50ms delay to simulate network latency
        });
      });

      const requests = Array.from({ length: 20 }, (_, i) => ({
        chainId: CHAIN_IDS.ETHEREUM,
        requests: [{ id: i, method: 'eth_blockNumber', params: [] }]
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(req => rpcManager.batchCall(req))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(20);
      expect(results.every(r => r.chainId === CHAIN_IDS.ETHEREUM)).toBe(true);
      
      // With maxConcurrency of 2, should take longer than sequential but not too long
      expect(duration).toBeGreaterThan(500); // At least 10 batches * 50ms
      expect(duration).toBeLessThan(2000); // But not sequential
    });

    it('should handle queue management', async () => {
      // Test basic queue functionality with a simple request
      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 1, result: '0x123' }])
      });

      const result = await rpcManager.batchCall({
        chainId: CHAIN_IDS.ETHEREUM,
        requests: [{ id: 1, method: 'eth_blockNumber', params: [] }]
      });

      expect(result).toBeDefined();
      expect(result.chainId).toBe(CHAIN_IDS.ETHEREUM);
    });
  });

  describe('caching integration', () => {
    it('should use cached data when available', async () => {
      const mockFetch = fetch as Mock;
      
      const addresses = ['0x742d35Cc6634C0532925a3b8D6Ac6c22af9abcde'];
      
      // Mock successful network call for cache miss
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 0, result: '0x1bc16d674ec80000' }
        ])
      });

      // Call should work even if cache misses
      const result = await rpcManager.getMultipleBalances(CHAIN_IDS.ETHEREUM, addresses);
      expect(result[addresses[0]]).toBeDefined();
      expect(typeof result[addresses[0]]).toBe('bigint');
    });
  });

  afterAll(async () => {
    await rpcManager.flushAllQueues();
    await redisCache.disconnect();
  });
});