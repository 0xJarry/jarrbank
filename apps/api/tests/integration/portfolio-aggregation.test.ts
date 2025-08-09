import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PortfolioAggregator } from '../../src/services/PortfolioAggregator';
import { TokenBalanceService } from '../../src/services/TokenBalanceService';
import { PriceService } from '../../src/services/PriceService';
import { TokenMetadataService } from '../../src/services/TokenMetadataService';
import { CHAIN_IDS } from '../../../../packages/shared/src/constants/chains';
import { AssetCategory } from '../../../../packages/shared/src/types/portfolio';

const mockTokenBalanceService = {
  detectTokenBalances: vi.fn(),
  categorizeToken: vi.fn(),
  batchFetchTokenBalances: vi.fn(),
  getFormattedBalances: vi.fn(),
  on: vi.fn(),
  emit: vi.fn()
};

const mockPriceService = {
  getTokenPrice: vi.fn(),
  getBatchTokenPrices: vi.fn(),
  getNativeTokenPrices: vi.fn(),
  clearCache: vi.fn(),
  on: vi.fn(),
  emit: vi.fn()
};

const mockMetadataService = {
  getTokenMetadata: vi.fn(),
  getBatchTokenMetadata: vi.fn(),
  getNativeTokenMetadata: vi.fn(),
  clearCache: vi.fn(),
  on: vi.fn(),
  emit: vi.fn()
};

describe('Portfolio Aggregation Integration', () => {
  let portfolioAggregator: PortfolioAggregator;
  const testUserId = 'test-user-123';
  const testWalletAddress = '0x742d35Cc6537C0532C8fd23Bb7b2E1e8d4b5b26F';
  const testChainIds = [CHAIN_IDS.ETHEREUM, CHAIN_IDS.ARBITRUM];

  beforeEach(() => {
    portfolioAggregator = new PortfolioAggregator(
      mockTokenBalanceService as any,
      mockPriceService as any,
      mockMetadataService as any
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('aggregatePortfolio', () => {
    it('should aggregate portfolio data across multiple chains', async () => {
      // Mock token balance data
      const mockBalanceData = [
        {
          chainId: CHAIN_IDS.ETHEREUM,
          walletAddress: testWalletAddress,
          nativeBalance: 2000000000000000000n, // 2 ETH
          tokens: [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              hasBalance: true,
              balance: 2000000000n // 2000 USDC (6 decimals)
            }
          ]
        },
        {
          chainId: CHAIN_IDS.ARBITRUM,
          walletAddress: testWalletAddress,
          nativeBalance: 500000000000000000n, // 0.5 ETH
          tokens: []
        }
      ];

      mockTokenBalanceService.detectTokenBalances.mockResolvedValue(mockBalanceData);

      // Mock native prices
      const mockNativePrices = new Map([
        [CHAIN_IDS.ETHEREUM, 2000],
        [CHAIN_IDS.ARBITRUM, 2000]
      ]);
      mockPriceService.getNativeTokenPrices.mockResolvedValue(mockNativePrices);

      // Mock token prices
      const mockTokenPrices = new Map([
        [`${CHAIN_IDS.ETHEREUM}:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`, {
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: CHAIN_IDS.ETHEREUM,
          priceUSD: 1.0,
          source: 'moralis',
          timestamp: new Date()
        }]
      ]);
      mockPriceService.getBatchTokenPrices.mockResolvedValue(mockTokenPrices);

      // Mock token metadata
      const mockTokenMetadata = new Map([
        [`${CHAIN_IDS.ETHEREUM}:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`, {
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          chainId: CHAIN_IDS.ETHEREUM,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        }]
      ]);
      mockMetadataService.getBatchTokenMetadata.mockResolvedValue(mockTokenMetadata);

      // Mock native metadata
      mockMetadataService.getNativeTokenMetadata.mockReturnValue({
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x0000000000000000000000000000000000000000'
      });

      // Mock categorization
      mockTokenBalanceService.categorizeToken.mockReturnValue(AssetCategory.STABLECOIN);

      const result = await portfolioAggregator.aggregatePortfolio(
        testUserId,
        testWalletAddress,
        testChainIds
      );

      expect(result).toHaveLength(2); // Two chains
      
      const ethPortfolio = result.find(p => p.chainId === CHAIN_IDS.ETHEREUM);
      const arbPortfolio = result.find(p => p.chainId === CHAIN_IDS.ARBITRUM);

      expect(ethPortfolio).toBeDefined();
      expect(ethPortfolio?.tokens).toHaveLength(2); // ETH + USDC
      expect(ethPortfolio?.totalValue).toBeGreaterThan(0n);

      expect(arbPortfolio).toBeDefined();
      expect(arbPortfolio?.tokens).toHaveLength(1); // Only ETH
    });

    it('should handle empty portfolios gracefully', async () => {
      const mockBalanceData = [
        {
          chainId: CHAIN_IDS.ETHEREUM,
          walletAddress: testWalletAddress,
          nativeBalance: 0n,
          tokens: []
        }
      ];

      mockTokenBalanceService.detectTokenBalances.mockResolvedValue(mockBalanceData);
      mockPriceService.getNativeTokenPrices.mockResolvedValue(new Map());
      mockPriceService.getBatchTokenPrices.mockResolvedValue(new Map());
      mockMetadataService.getBatchTokenMetadata.mockResolvedValue(new Map());

      const result = await portfolioAggregator.aggregatePortfolio(
        testUserId,
        testWalletAddress,
        [CHAIN_IDS.ETHEREUM]
      );

      expect(result).toHaveLength(1);
      expect(result[0].totalValue).toBe(0n);
      expect(result[0].tokens).toHaveLength(0);
    });

    it('should emit aggregation events', async () => {
      const eventHandler = vi.fn();
      portfolioAggregator.on('aggregationComplete', eventHandler);

      const mockBalanceData = [
        {
          chainId: CHAIN_IDS.ETHEREUM,
          walletAddress: testWalletAddress,
          nativeBalance: 1000000000000000000n,
          tokens: []
        }
      ];

      mockTokenBalanceService.detectTokenBalances.mockResolvedValue(mockBalanceData);
      mockPriceService.getNativeTokenPrices.mockResolvedValue(new Map([[CHAIN_IDS.ETHEREUM, 2000]]));
      mockPriceService.getBatchTokenPrices.mockResolvedValue(new Map());
      mockMetadataService.getBatchTokenMetadata.mockResolvedValue(new Map());
      mockMetadataService.getNativeTokenMetadata.mockReturnValue({
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x0000000000000000000000000000000000000000'
      });

      await portfolioAggregator.aggregatePortfolio(
        testUserId,
        testWalletAddress,
        [CHAIN_IDS.ETHEREUM]
      );

      expect(eventHandler).toHaveBeenCalledWith({
        userId: testUserId,
        portfolioCount: 1,
        tokenCount: 1,
        duration: expect.any(Number)
      });
    });
  });

  describe('getPortfolioSummary', () => {
    it('should generate comprehensive portfolio summary', async () => {
      // Setup mock data for a realistic portfolio
      const mockBalanceData = [
        {
          chainId: CHAIN_IDS.ETHEREUM,
          walletAddress: testWalletAddress,
          nativeBalance: 5000000000000000000n, // 5 ETH
          tokens: [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              hasBalance: true,
              balance: 10000000000n // 10,000 USDC
            },
            {
              address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
              hasBalance: true,
              balance: 1000000000000000000000n // 1000 UNI
            }
          ]
        }
      ];

      mockTokenBalanceService.detectTokenBalances.mockResolvedValue(mockBalanceData);
      mockPriceService.getNativeTokenPrices.mockResolvedValue(new Map([[CHAIN_IDS.ETHEREUM, 2000]]));

      const mockTokenPrices = new Map([
        [`${CHAIN_IDS.ETHEREUM}:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`, {
          priceUSD: 1.0,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: CHAIN_IDS.ETHEREUM,
          source: 'moralis',
          timestamp: new Date()
        }],
        [`${CHAIN_IDS.ETHEREUM}:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984`, {
          priceUSD: 7.5,
          tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          chainId: CHAIN_IDS.ETHEREUM,
          source: 'moralis',
          timestamp: new Date()
        }]
      ]);
      mockPriceService.getBatchTokenPrices.mockResolvedValue(mockTokenPrices);

      const mockTokenMetadata = new Map([
        [`${CHAIN_IDS.ETHEREUM}:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`, {
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          chainId: CHAIN_IDS.ETHEREUM,
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        }],
        [`${CHAIN_IDS.ETHEREUM}:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984`, {
          name: 'Uniswap',
          symbol: 'UNI',
          decimals: 18,
          chainId: CHAIN_IDS.ETHEREUM,
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
        }]
      ]);
      mockMetadataService.getBatchTokenMetadata.mockResolvedValue(mockTokenMetadata);

      mockMetadataService.getNativeTokenMetadata.mockReturnValue({
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x0000000000000000000000000000000000000000'
      });

      mockTokenBalanceService.categorizeToken
        .mockReturnValueOnce(AssetCategory.STABLECOIN) // USDC
        .mockReturnValueOnce(AssetCategory.DEFI);       // UNI

      const summary = await portfolioAggregator.getPortfolioSummary(
        testUserId,
        testWalletAddress,
        [CHAIN_IDS.ETHEREUM]
      );

      expect(summary.totalValueUSD).toBeGreaterThan(0n);
      expect(summary.chainBreakdown).toHaveLength(1);
      expect(summary.chainBreakdown[0].chainId).toBe(CHAIN_IDS.ETHEREUM);
      expect(summary.topTokens).toHaveLength(3); // ETH, USDC, UNI
      expect(summary.assetComposition).toContainEqual(
        expect.objectContaining({
          category: AssetCategory.STABLECOIN
        })
      );
      expect(summary.assetComposition).toContainEqual(
        expect.objectContaining({
          category: AssetCategory.DEFI
        })
      );
    });

    it('should handle multi-chain portfolios correctly', async () => {
      const mockBalanceData = [
        {
          chainId: CHAIN_IDS.ETHEREUM,
          walletAddress: testWalletAddress,
          nativeBalance: 2000000000000000000n, // 2 ETH
          tokens: []
        },
        {
          chainId: CHAIN_IDS.ARBITRUM,
          walletAddress: testWalletAddress,
          nativeBalance: 1000000000000000000n, // 1 ETH
          tokens: []
        }
      ];

      mockTokenBalanceService.detectTokenBalances.mockResolvedValue(mockBalanceData);
      mockPriceService.getNativeTokenPrices.mockResolvedValue(
        new Map([
          [CHAIN_IDS.ETHEREUM, 2000],
          [CHAIN_IDS.ARBITRUM, 2000]
        ])
      );
      mockPriceService.getBatchTokenPrices.mockResolvedValue(new Map());
      mockMetadataService.getBatchTokenMetadata.mockResolvedValue(new Map());
      mockMetadataService.getNativeTokenMetadata.mockReturnValue({
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x0000000000000000000000000000000000000000'
      });

      const summary = await portfolioAggregator.getPortfolioSummary(
        testUserId,
        testWalletAddress,
        testChainIds
      );

      expect(summary.chainBreakdown).toHaveLength(2);
      expect(summary.chainBreakdown.find(c => c.chainId === CHAIN_IDS.ETHEREUM)?.percentage).toBeCloseTo(66.67, 1);
      expect(summary.chainBreakdown.find(c => c.chainId === CHAIN_IDS.ARBITRUM)?.percentage).toBeCloseTo(33.33, 1);
    });
  });

  describe('syncPortfolioData', () => {
    it('should sync portfolio data and return sync result', async () => {
      const portfolioId = `${testUserId}-${CHAIN_IDS.ETHEREUM}`;
      
      const mockBalanceData = [
        {
          chainId: CHAIN_IDS.ETHEREUM,
          walletAddress: testWalletAddress,
          nativeBalance: 1000000000000000000n,
          tokens: [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              hasBalance: true,
              balance: 1000000000n
            }
          ]
        }
      ];

      mockTokenBalanceService.detectTokenBalances.mockResolvedValue(mockBalanceData);
      mockPriceService.getNativeTokenPrices.mockResolvedValue(new Map([[CHAIN_IDS.ETHEREUM, 2000]]));
      mockPriceService.getBatchTokenPrices.mockResolvedValue(new Map());
      mockMetadataService.getBatchTokenMetadata.mockResolvedValue(new Map());
      mockMetadataService.getNativeTokenMetadata.mockReturnValue({
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x0000000000000000000000000000000000000000'
      });

      const result = await portfolioAggregator.syncPortfolioData(
        portfolioId,
        testWalletAddress,
        CHAIN_IDS.ETHEREUM
      );

      expect(result.success).toBe(true);
      expect(result.portfolioId).toBe(portfolioId);
      expect(result.tokensUpdated).toBe(1); // ETH
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle sync errors gracefully', async () => {
      const portfolioId = `${testUserId}-${CHAIN_IDS.ETHEREUM}`;
      
      mockTokenBalanceService.detectTokenBalances.mockRejectedValue(new Error('Network error'));

      const result = await portfolioAggregator.syncPortfolioData(
        portfolioId,
        testWalletAddress,
        CHAIN_IDS.ETHEREUM
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Network error');
    });
  });

  describe('refreshPortfolio', () => {
    it('should refresh portfolio with cache clearing when forced', async () => {
      const mockBalanceData = [
        {
          chainId: CHAIN_IDS.ETHEREUM,
          walletAddress: testWalletAddress,
          nativeBalance: 1000000000000000000n,
          tokens: []
        }
      ];

      mockTokenBalanceService.detectTokenBalances.mockResolvedValue(mockBalanceData);
      mockPriceService.getNativeTokenPrices.mockResolvedValue(new Map([[CHAIN_IDS.ETHEREUM, 2000]]));
      mockPriceService.getBatchTokenPrices.mockResolvedValue(new Map());
      mockMetadataService.getBatchTokenMetadata.mockResolvedValue(new Map());
      mockMetadataService.getNativeTokenMetadata.mockReturnValue({
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x0000000000000000000000000000000000000000'
      });

      await portfolioAggregator.refreshPortfolio(
        testUserId,
        testWalletAddress,
        CHAIN_IDS.ETHEREUM,
        true // forceRefresh
      );

      expect(mockPriceService.clearCache).toHaveBeenCalled();
    });

    it('should not clear cache when not forced', async () => {
      const mockBalanceData = [
        {
          chainId: CHAIN_IDS.ETHEREUM,
          walletAddress: testWalletAddress,
          nativeBalance: 1000000000000000000n,
          tokens: []
        }
      ];

      mockTokenBalanceService.detectTokenBalances.mockResolvedValue(mockBalanceData);
      mockPriceService.getNativeTokenPrices.mockResolvedValue(new Map([[CHAIN_IDS.ETHEREUM, 2000]]));
      mockPriceService.getBatchTokenPrices.mockResolvedValue(new Map());
      mockMetadataService.getBatchTokenMetadata.mockResolvedValue(new Map());
      mockMetadataService.getNativeTokenMetadata.mockReturnValue({
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        chainId: CHAIN_IDS.ETHEREUM,
        address: '0x0000000000000000000000000000000000000000'
      });

      await portfolioAggregator.refreshPortfolio(
        testUserId,
        testWalletAddress,
        CHAIN_IDS.ETHEREUM,
        false
      );

      expect(mockPriceService.clearCache).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should emit aggregation error events', async () => {
      const errorHandler = vi.fn();
      portfolioAggregator.on('aggregationError', errorHandler);

      mockTokenBalanceService.detectTokenBalances.mockRejectedValue(new Error('Service unavailable'));

      await expect(
        portfolioAggregator.aggregatePortfolio(
          testUserId,
          testWalletAddress,
          [CHAIN_IDS.ETHEREUM]
        )
      ).rejects.toThrow('Service unavailable');

      expect(errorHandler).toHaveBeenCalledWith({
        userId: testUserId,
        error: expect.any(Error)
      });
    });
  });
});