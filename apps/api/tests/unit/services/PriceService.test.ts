import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PriceService } from '../../../src/services/PriceService';
import { CHAIN_IDS } from '../../../../../packages/shared/src/constants/chains';

const mockRedisClient = {
  get: vi.fn(),
  setex: vi.fn(),
  keys: vi.fn(),
  del: vi.fn(),
  flushdb: vi.fn()
};

vi.mock('../../../src/db/redis', () => ({
  getRedisClient: () => mockRedisClient
}));

global.fetch = vi.fn();

describe('PriceService', () => {
  let priceService: PriceService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      MORALIS_API_KEY: 'test-moralis-key',
      COINMARKETCAP_API_KEY: 'test-cmc-key'
    };
    priceService = new PriceService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getTokenPrice', () => {
    it('should return cached price when available', async () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const cachedPrice = {
        tokenAddress: tokenAddress.toLowerCase(),
        chainId: CHAIN_IDS.ETHEREUM,
        priceUSD: 1.0,
        source: 'moralis',
        timestamp: new Date().toISOString()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedPrice));

      const result = await priceService.getTokenPrice(tokenAddress, CHAIN_IDS.ETHEREUM);

      expect(result).toEqual({
        ...cachedPrice,
        timestamp: expect.any(Date)
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch from Moralis as primary provider', async () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      
      mockRedisClient.get.mockResolvedValue(null);

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ usdPrice: 0.999 })
      } as Response);

      const result = await priceService.getTokenPrice(tokenAddress, CHAIN_IDS.ETHEREUM);

      expect(result).toEqual({
        tokenAddress: tokenAddress.toLowerCase(),
        chainId: CHAIN_IDS.ETHEREUM,
        priceUSD: 0.999,
        source: 'moralis',
        timestamp: expect.any(Date)
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('moralis.io'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'test-moralis-key'
          })
        })
      );
    });

    it('should fallback to DefiLlama when Moralis fails', async () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      
      mockRedisClient.get.mockResolvedValue(null);

      const mockFetch = vi.mocked(fetch);
      
      // Moralis fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);
      
      // DefiLlama succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          coins: {
            [`ethereum:${tokenAddress}`]: { price: 1.001 }
          }
        })
      } as Response);

      const result = await priceService.getTokenPrice(tokenAddress, CHAIN_IDS.ETHEREUM);

      expect(result).toEqual({
        tokenAddress: tokenAddress.toLowerCase(),
        chainId: CHAIN_IDS.ETHEREUM,
        priceUSD: 1.001,
        source: 'defiLlama',
        timestamp: expect.any(Date)
      });
    });

    it('should fallback to CoinMarketCap when other providers fail', async () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      
      mockRedisClient.get.mockResolvedValue(null);

      const mockFetch = vi.mocked(fetch);
      
      // Moralis fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as Response);
      
      // DefiLlama fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);
      
      // CoinMarketCap succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: {
            '12345': {
              quote: { USD: { price: 0.998 } }
            }
          }
        })
      } as Response);

      const result = await priceService.getTokenPrice(tokenAddress, CHAIN_IDS.ETHEREUM);

      expect(result).toEqual({
        tokenAddress: tokenAddress.toLowerCase(),
        chainId: CHAIN_IDS.ETHEREUM,
        priceUSD: 0.998,
        source: 'coinmarketcap',
        timestamp: expect.any(Date)
      });
    });

    it('should return null when all providers fail', async () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      
      mockRedisClient.get.mockResolvedValue(null);

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404
      } as Response);

      const result = await priceService.getTokenPrice(tokenAddress, CHAIN_IDS.ETHEREUM);

      expect(result).toBeNull();
    });
  });

  describe('getBatchTokenPrices', () => {
    it('should fetch multiple token prices efficiently', async () => {
      const tokens = [
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: CHAIN_IDS.ETHEREUM },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chainId: CHAIN_IDS.ETHEREUM }
      ];

      mockRedisClient.get.mockResolvedValue(null);

      const mockFetch = vi.mocked(fetch);
      
      // Mock Moralis batch response for first token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ usdPrice: 1.0 })
      } as Response);
      
      // Mock Moralis batch response for second token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ usdPrice: 1.0 })
      } as Response);

      const result = await priceService.getBatchTokenPrices(tokens);

      expect(result.size).toBe(2);
      
      const firstKey = `${CHAIN_IDS.ETHEREUM}:${tokens[0].address.toLowerCase()}`;
      const secondKey = `${CHAIN_IDS.ETHEREUM}:${tokens[1].address.toLowerCase()}`;
      
      expect(result.get(firstKey)).toEqual({
        tokenAddress: tokens[0].address.toLowerCase(),
        chainId: CHAIN_IDS.ETHEREUM,
        priceUSD: 1.0,
        source: 'moralis',
        timestamp: expect.any(Date)
      });
      
      expect(result.get(secondKey)).toEqual({
        tokenAddress: tokens[1].address.toLowerCase(),
        chainId: CHAIN_IDS.ETHEREUM,
        priceUSD: 1.0,
        source: 'moralis',
        timestamp: expect.any(Date)
      });
    });

    it('should return cached prices and only fetch uncached ones', async () => {
      const tokens = [
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: CHAIN_IDS.ETHEREUM },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chainId: CHAIN_IDS.ETHEREUM }
      ];

      const cachedPrice = {
        tokenAddress: tokens[0].address.toLowerCase(),
        chainId: CHAIN_IDS.ETHEREUM,
        priceUSD: 0.999,
        source: 'moralis',
        timestamp: new Date().toISOString()
      };

      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify(cachedPrice)) // First token cached
        .mockResolvedValueOnce(null); // Second token not cached

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ usdPrice: 1.001 })
      } as Response);

      const result = await priceService.getBatchTokenPrices(tokens);

      expect(result.size).toBe(2);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only called for uncached token
    });
  });

  describe('getNativeTokenPrices', () => {
    it('should fetch native token prices from CoinGecko', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            eth: { usd: 2000 }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            avax: { usd: 25 }
          })
        } as Response);

      const result = await priceService.getNativeTokenPrices();

      expect(result.get(CHAIN_IDS.ETHEREUM)).toBe(2000);
      expect(result.get(CHAIN_IDS.ARBITRUM)).toBe(2000); // Same as ETH
      expect(result.get(CHAIN_IDS.AVALANCHE)).toBe(25);
    });

    it('should return cached native prices when available', async () => {
      mockRedisClient.get
        .mockResolvedValueOnce('2000') // ETH cached
        .mockResolvedValueOnce('25');  // AVAX cached

      const result = await priceService.getNativeTokenPrices();

      expect(result.get(CHAIN_IDS.ETHEREUM)).toBe(2000);
      expect(result.get(CHAIN_IDS.AVALANCHE)).toBe(25);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('caching behavior', () => {
    it('should cache fetched prices with correct TTL', async () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      
      mockRedisClient.get.mockResolvedValue(null);

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ usdPrice: 1.0 })
      } as Response);

      await priceService.getTokenPrice(tokenAddress, CHAIN_IDS.ETHEREUM);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        `price:${CHAIN_IDS.ETHEREUM}:${tokenAddress.toLowerCase()}`,
        15, // 15 second TTL
        expect.any(String)
      );
    });

    it('should skip cache when skipCache is true', async () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      
      const cachedPrice = {
        tokenAddress: tokenAddress.toLowerCase(),
        chainId: CHAIN_IDS.ETHEREUM,
        priceUSD: 0.999,
        source: 'moralis',
        timestamp: new Date().toISOString()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedPrice));

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ usdPrice: 1.001 })
      } as Response);

      const result = await priceService.getTokenPrice(tokenAddress, CHAIN_IDS.ETHEREUM, true);

      expect(mockRedisClient.get).not.toHaveBeenCalled();
      expect(result?.priceUSD).toBe(1.001);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should emit error events when providers fail', async () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const errorHandler = vi.fn();
      
      priceService.on('providerError', errorHandler);
      
      mockRedisClient.get.mockResolvedValue(null);

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      await priceService.getTokenPrice(tokenAddress, CHAIN_IDS.ETHEREUM);

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'moralis',
          error: expect.any(Error),
          tokenAddress,
          chainId: CHAIN_IDS.ETHEREUM
        })
      );
    });

    it('should emit priceNotFound event when no provider returns price', async () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const notFoundHandler = vi.fn();
      
      priceService.on('priceNotFound', notFoundHandler);
      
      mockRedisClient.get.mockResolvedValue(null);

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404
      } as Response);

      await priceService.getTokenPrice(tokenAddress, CHAIN_IDS.ETHEREUM);

      expect(notFoundHandler).toHaveBeenCalledWith({
        tokenAddress,
        chainId: CHAIN_IDS.ETHEREUM
      });
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      await priceService.clearCache();
      
      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });
  });
});