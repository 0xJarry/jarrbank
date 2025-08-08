import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { RpcBatchManager, BatchRequest } from '../../../src/services/RpcBatchManager';
import { RpcProviderManager } from '../../../../../packages/web3/src/rpc/providers';
import { CHAIN_IDS } from '../../../../../packages/shared/src/constants/chains';
import { 
  mockRpcRequests, 
  mockRpcResponses, 
  mockProviderConfig,
  mockBalanceData,
  mockTokenBalanceData,
  mockBlockNumbers
} from '../../fixtures/rpc-responses';

// Mock fetch globally
global.fetch = vi.fn();

describe('RpcBatchManager', () => {
  let rpcManager: RpcBatchManager;
  let providerManager: RpcProviderManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    providerManager = new RpcProviderManager(mockProviderConfig);
    rpcManager = new RpcBatchManager(providerManager);
  });

  describe('batchCall', () => {
    it('should successfully execute a batch of RPC requests', async () => {
      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRpcResponses)
      });

      const batchRequest: BatchRequest = {
        chainId: CHAIN_IDS.ETHEREUM,
        requests: mockRpcRequests
      };

      const result = await rpcManager.batchCall(batchRequest);

      expect(result.chainId).toBe(CHAIN_IDS.ETHEREUM);
      expect(result.responses).toEqual(mockRpcResponses);
      expect(result.provider).toBe('Alchemy-ETH');
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle provider failover on error', async () => {
      const mockFetch = fetch as Mock;
      
      // Add error event listener to handle emitted errors
      const errorSpy = vi.fn();
      rpcManager.on('error', errorSpy);
      
      // First call fails (Alchemy)
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Second call succeeds (Infura)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRpcResponses)
      });

      const batchRequest: BatchRequest = {
        chainId: CHAIN_IDS.ETHEREUM,
        requests: mockRpcRequests
      };

      const result = await rpcManager.batchCall(batchRequest);

      expect(result.provider).toBe('Infura-ETH');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should emit failover event when switching providers', async () => {
      const mockFetch = fetch as Mock;
      
      // Add error and failover event listeners
      const errorSpy = vi.fn();
      const failoverSpy = vi.fn();
      rpcManager.on('error', errorSpy);
      rpcManager.on('failover', failoverSpy);
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRpcResponses)
      });

      const batchRequest: BatchRequest = {
        chainId: CHAIN_IDS.ETHEREUM,
        requests: mockRpcRequests
      };

      await rpcManager.batchCall(batchRequest);

      expect(failoverSpy).toHaveBeenCalledWith({
        chainId: CHAIN_IDS.ETHEREUM,
        from: 'Alchemy-ETH',
        to: 'Infura-ETH'
      });
    });

    it('should throw error when all providers fail', async () => {
      const mockFetch = fetch as Mock;
      
      // Add error event listener to handle emitted errors
      const errorSpy = vi.fn();
      rpcManager.on('error', errorSpy);
      
      mockFetch.mockRejectedValue(new Error('Network error'));

      const batchRequest: BatchRequest = {
        chainId: CHAIN_IDS.ETHEREUM,
        requests: mockRpcRequests
      };

      await expect(rpcManager.batchCall(batchRequest)).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Primary + fallback
    });
  });

  describe('getMultipleBalances', () => {
    it('should fetch balances for multiple addresses', async () => {
      const addresses = ['0x742d35Cc6634C0532925a3b8D6Ac6c22af9abcde', '0x8ba1f109551bD432803012645Hac136c22af9abcde'];

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 0, result: '0x1bc16d674ec80000' }, // 2 ETH
          { id: 1, result: '0x56bc75e2d631000' }   // 0.1 ETH
        ])
      });

      const balances = await rpcManager.getMultipleBalances(CHAIN_IDS.ETHEREUM, addresses);

      expect(balances[addresses[0]]).toBe(BigInt('2000000000000000000'));
      expect(balances[addresses[1]]).toBe(BigInt('390625000000000000'));
      expect(Object.keys(balances)).toHaveLength(2);
    });

    it('should handle individual balance fetch errors gracefully', async () => {
      const addresses = ['0x742d35Cc6634C0532925a3b8D6Ac6c22af9abcde', '0xinvalid'];

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 0, result: '0x1bc16d674ec80000' },
          { id: 1, error: { code: -32602, message: 'Invalid address' } }
        ])
      });

      const balances = await rpcManager.getMultipleBalances(CHAIN_IDS.ETHEREUM, addresses);

      expect(balances[addresses[0]]).toBe(BigInt('2000000000000000000'));
      expect(balances).not.toHaveProperty(addresses[1]); // undefined key should not exist
    });
  });

  describe('getMultipleTokenBalances', () => {
    it('should fetch token balances for multiple wallets', async () => {
      const wallets = Object.keys(mockTokenBalanceData.balances);
      const expectedBalances = mockTokenBalanceData.balances;

      const mockFetch = fetch as Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 0, result: '0x3635c9adc5dea00000' }, // 1000 tokens
          { id: 1, result: '0x1b1ae4d6e2ef500000' }  // 500 tokens
        ])
      });

      const balances = await rpcManager.getMultipleTokenBalances(
        CHAIN_IDS.ETHEREUM,
        mockTokenBalanceData.tokenAddress,
        wallets
      );

      expect(balances).toEqual(expectedBalances);
    });
  });

  describe('getMultipleBlockNumbers', () => {
    it('should fetch block numbers for multiple chains', async () => {
      const chainIds = [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM];

      const mockFetch = fetch as Mock;
      mockFetch.mockImplementation((url) => {
        if (url.includes('eth-mainnet')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, result: '0x1234567' }])
          });
        } else if (url.includes('arb-mainnet')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, result: '0x9e0e484' }])
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const blockNumbers = await rpcManager.getMultipleBlockNumbers(chainIds);

      // Check that we get BigInt values for both chains
      expect(typeof blockNumbers[CHAIN_IDS.ETHEREUM]).toBe('bigint');
      expect(typeof blockNumbers[CHAIN_IDS.ARBITRUM]).toBe('bigint');
      expect(blockNumbers[CHAIN_IDS.ETHEREUM]).toBeGreaterThan(0n);
      expect(blockNumbers[CHAIN_IDS.ARBITRUM]).toBeGreaterThan(0n);
    });
  });

  describe('queue management', () => {
    it('should queue requests and batch them', () => {
      const chainId = CHAIN_IDS.ETHEREUM;
      const request = mockRpcRequests[0];

      rpcManager.queueRequest(chainId, request);
      
      expect(rpcManager.getQueueDepth(chainId)).toBe(1);
    });

    it('should flush queue when batch size is reached', () => {
      rpcManager.setBatchSize(2);
      
      const chainId = CHAIN_IDS.ETHEREUM;
      const request1 = mockRpcRequests[0];
      const request2 = mockRpcRequests[1];

      rpcManager.queueRequest(chainId, request1);
      expect(rpcManager.getQueueDepth(chainId)).toBe(1);

      rpcManager.queueRequest(chainId, request2);
      // Should flush automatically when reaching batch size
      expect(rpcManager.getQueueDepth(chainId)).toBe(0);
    });

    it('should configure batch settings', () => {
      rpcManager.setBatchSize(50);
      rpcManager.setBatchDelay(100);

      // Test that settings are applied by queuing just under batch size
      const chainId = CHAIN_IDS.ETHEREUM;
      for (let i = 0; i < 49; i++) {
        rpcManager.queueRequest(chainId, { id: i, method: 'test', params: [] });
      }

      expect(rpcManager.getQueueDepth(chainId)).toBe(49);
    });
  });
});