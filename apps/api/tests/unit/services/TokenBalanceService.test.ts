import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenBalanceService } from '../../../src/services/TokenBalanceService';
import { RpcBatchManager } from '../../../src/services/RPCBatchManager';
import { CHAIN_IDS } from '../../../../../packages/shared/src/constants/chains';
import { AssetCategory } from '../../../../../packages/shared/src/types/portfolio';

const mockRpcBatchManager = {
  batchCall: vi.fn(),
  getMultipleBalances: vi.fn(),
  getMultipleBlockNumbers: vi.fn(),
  getMultipleTokenBalances: vi.fn()
};

const mockRedisClient = {
  get: vi.fn(),
  setEx: vi.fn(),
  keys: vi.fn(),
  del: vi.fn()
};

vi.mock('../../../src/db/redis', () => ({
  getRedisClient: () => mockRedisClient
}));

global.fetch = vi.fn();

describe('TokenBalanceService', () => {
  let tokenBalanceService: TokenBalanceService;

  beforeEach(() => {
    tokenBalanceService = new TokenBalanceService(mockRpcBatchManager as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectTokenBalances', () => {
    it('should detect native and token balances for a wallet', async () => {
      const walletAddress = '0x742d35Cc6537C0532C8fd23Bb7b2E1e8d4b5b26F';
      const chainIds = [CHAIN_IDS.ETHEREUM];

      mockRedisClient.get.mockResolvedValue(null);
      
      // Mock native balance call
      mockRpcBatchManager.batchCall.mockResolvedValueOnce({
        chainId: CHAIN_IDS.ETHEREUM,
        responses: [{ id: 1, result: '0x1bc16d674ec80000' }] // 2 ETH
      });

      // Mock token balance calls for each common token (simplified to 1 for test)
      mockRpcBatchManager.batchCall.mockResolvedValue({
        chainId: CHAIN_IDS.ETHEREUM,
        responses: [{ id: 0, result: '0x6c6b935b8bbd400000' }] // Token balance
      });

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: {
            tokenBalances: [
              {
                contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                tokenBalance: '0x6c6b935b8bbd400000'
              }
            ]
          }
        })
      } as Response);

      const result = await tokenBalanceService.detectTokenBalances(walletAddress, chainIds);

      expect(result).toHaveLength(1);
      expect(result[0].chainId).toBe(CHAIN_IDS.ETHEREUM);
      expect(result[0].nativeBalance).toBe(2000000000000000000n);
      expect(result[0].tokens).toEqual([
        expect.objectContaining({
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          hasBalance: true,
          balance: expect.any(BigInt)
        })
      ]);
    });

    it('should return cached results when available', async () => {
      const walletAddress = '0x742d35Cc6537C0532C8fd23Bb7b2E1e8d4b5b26F';
      const chainIds = [CHAIN_IDS.ETHEREUM];

      const cachedData = {
        chainId: CHAIN_IDS.ETHEREUM,
        walletAddress,
        nativeBalance: '2000000000000000000',
        tokens: [{
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          hasBalance: true,
          balance: '2000000000'
        }]
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await tokenBalanceService.detectTokenBalances(walletAddress, chainIds);

      expect(mockRpcBatchManager.batchCall).not.toHaveBeenCalled();
      expect(result[0].nativeBalance).toBe(2000000000000000000n);
      expect(result[0].tokens[0].balance).toBe(2000000000n);
    });
  });

  describe('categorizeToken', () => {
    it('should categorize stablecoins correctly', () => {
      const usdcMetadata = {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      };

      const category = tokenBalanceService.categorizeToken(usdcMetadata);
      expect(category).toBe(AssetCategory.STABLECOIN);
    });

    it('should categorize blue chip tokens correctly', () => {
      const wethMetadata = {
        name: 'Wrapped Ethereum',
        symbol: 'WETH',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
      };

      const category = tokenBalanceService.categorizeToken(wethMetadata);
      expect(category).toBe(AssetCategory.BLUECHIP);
    });

    it('should categorize DeFi tokens correctly', () => {
      const uniMetadata = {
        name: 'Uniswap',
        symbol: 'UNI',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
      };

      const category = tokenBalanceService.categorizeToken(uniMetadata);
      expect(category).toBe(AssetCategory.DEFI);
    });

    it('should categorize meme tokens correctly', () => {
      const shibaMetadata = {
        name: 'Shiba Inu',
        symbol: 'SHIB',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE'
      };

      const category = tokenBalanceService.categorizeToken(shibaMetadata);
      expect(category).toBe(AssetCategory.MEME);
    });

    it('should categorize unknown tokens as OTHER', () => {
      const unknownMetadata = {
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x1234567890123456789012345678901234567890'
      };

      const category = tokenBalanceService.categorizeToken(unknownMetadata);
      expect(category).toBe(AssetCategory.OTHER);
    });
  });

  describe('batchFetchTokenBalances', () => {
    it('should fetch multiple token balances efficiently', async () => {
      const walletAddress = '0x742d35Cc6537C0532C8fd23Bb7b2E1e8d4b5b26F';
      const tokenAddresses = [
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        '0xdAC17F958D2ee523a2206206994597C13D831ec7'  // USDT
      ];

      mockRpcBatchManager.batchCall.mockResolvedValue({
        chainId: CHAIN_IDS.ETHEREUM,
        responses: [
          { id: 0, result: '0x6c6b935b8bbd400000' }, // 2000 USDC
          { id: 1, result: '0x6c6b935b8bbd400000' }  // 2000 USDT
        ]
      });

      const result = await tokenBalanceService.batchFetchTokenBalances(
        walletAddress,
        tokenAddresses,
        CHAIN_IDS.ETHEREUM
      );

      expect(result.size).toBe(2);
      expect(result.get(tokenAddresses[0].toLowerCase())).toBe(2000000000000000000000n);
      expect(result.get(tokenAddresses[1].toLowerCase())).toBe(2000000000000000000000n);
    });

    it('should handle empty token addresses array', async () => {
      const walletAddress = '0x742d35Cc6537C0532C8fd23Bb7b2E1e8d4b5b26F';
      
      const result = await tokenBalanceService.batchFetchTokenBalances(
        walletAddress,
        [],
        CHAIN_IDS.ETHEREUM
      );

      expect(result.size).toBe(0);
      expect(mockRpcBatchManager.batchCall).not.toHaveBeenCalled();
    });
  });

  describe('getFormattedBalances', () => {
    it('should return formatted balance information', async () => {
      const walletAddress = '0x742d35Cc6537C0532C8fd23Bb7b2E1e8d4b5b26F';
      const chainIds = [CHAIN_IDS.ETHEREUM];

      mockRedisClient.get.mockResolvedValue(null);
      
      mockRpcBatchManager.batchCall
        .mockResolvedValueOnce({
          chainId: CHAIN_IDS.ETHEREUM,
          responses: [{ id: 1, result: '0x1bc16d674ec80000' }] // 2 ETH
        })
        .mockResolvedValueOnce({
          chainId: CHAIN_IDS.ETHEREUM,
          responses: [{ id: 0, result: '0x6c6b935b8bbd400000' }] // Token balance
        });

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { tokenBalances: [] }
        })
      } as Response);

      const result = await tokenBalanceService.getFormattedBalances(walletAddress, chainIds);

      expect(result.hasBalances).toBe(true);
      expect(result.chains).toHaveLength(1);
      expect(result.chains[0].nativeBalance).toBeGreaterThan(0n);
    });

    it('should detect when wallet has no balances', async () => {
      const walletAddress = '0x742d35Cc6537C0532C8fd23Bb7b2E1e8d4b5b26F';
      const chainIds = [CHAIN_IDS.ETHEREUM];

      mockRedisClient.get.mockResolvedValue(null);
      
      mockRpcBatchManager.batchCall.mockResolvedValue({
        chainId: CHAIN_IDS.ETHEREUM,
        responses: [{ id: 1, result: '0x0' }] // 0 balance
      });

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { tokenBalances: [] }
        })
      } as Response);

      const result = await tokenBalanceService.getFormattedBalances(walletAddress, chainIds);

      expect(result.hasBalances).toBe(false);
      expect(result.totalTokensFound).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle RPC errors gracefully', async () => {
      const walletAddress = '0x742d35Cc6537C0532C8fd23Bb7b2E1e8d4b5b26F';
      const chainIds = [CHAIN_IDS.ETHEREUM];

      mockRedisClient.get.mockResolvedValue(null);
      mockRpcBatchManager.batchCall.mockRejectedValue(new Error('RPC Error'));

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      const result = await tokenBalanceService.detectTokenBalances(walletAddress, chainIds);

      expect(result).toHaveLength(1);
      expect(result[0].nativeBalance).toBe(0n);
      expect(result[0].tokens).toEqual([]);
    });

    it('should emit error events for tracking', async () => {
      const walletAddress = '0x742d35Cc6537C0532C8fd23Bb7b2E1e8d4b5b26F';
      const chainIds = [CHAIN_IDS.ETHEREUM];

      const errorHandler = vi.fn();
      tokenBalanceService.on('error', errorHandler);

      mockRedisClient.get.mockResolvedValue(null);
      mockRpcBatchManager.batchCall.mockRejectedValue(new Error('Network timeout'));

      await tokenBalanceService.detectTokenBalances(walletAddress, chainIds);

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'getNativeBalance',
          chainId: CHAIN_IDS.ETHEREUM,
          error: expect.any(Error)
        })
      );
    });
  });
});