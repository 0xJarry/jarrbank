"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioAggregator = void 0;
const portfolio_1 = require("../../../../packages/shared/src/types/portfolio");
const format_1 = require("../../../../packages/shared/src/utils/format");
const events_1 = require("events");
class PortfolioAggregator extends events_1.EventEmitter {
    tokenBalanceService;
    priceService;
    metadataService;
    constructor(tokenBalanceService, priceService, metadataService) {
        super();
        this.tokenBalanceService = tokenBalanceService;
        this.priceService = priceService;
        this.metadataService = metadataService;
    }
    async aggregatePortfolio(userId, walletAddress, chainIds) {
        const startTime = Date.now();
        const portfolios = [];
        try {
            const balanceData = await this.tokenBalanceService.detectTokenBalances(walletAddress, chainIds);
            const nativePrices = await this.priceService.getNativeTokenPrices();
            // Debug logging for native prices 
            console.log('Native prices fetched:', Object.fromEntries(nativePrices));
            const allTokens = [];
            balanceData.forEach(chain => {
                chain.tokens.forEach(token => {
                    if (token.hasBalance) {
                        allTokens.push({ address: token.address, chainId: chain.chainId });
                    }
                });
            });
            const [tokenPrices, tokenMetadata] = await Promise.all([
                this.priceService.getBatchTokenPrices(allTokens),
                this.metadataService.getBatchTokenMetadata(allTokens)
            ]);
            for (const chainData of balanceData) {
                const portfolioId = `${userId}-${chainData.chainId}`;
                const tokens = [];
                // Debug logging for native balance
                console.log(`Chain ${chainData.chainId} native balance:`, chainData.nativeBalance.toString());
                if (chainData.nativeBalance > 0n) {
                    const nativePrice = nativePrices.get(chainData.chainId);
                    const nativeMetadata = this.metadataService.getNativeTokenMetadata(chainData.chainId);
                    // Create native token even if price is unavailable (use 0 for price/value)
                    const priceInCents = nativePrice ? (0, format_1.parsePriceToUSDCents)(nativePrice) : 0n;
                    const valueUSD = nativePrice ? (0, format_1.calculateTokenValue)(chainData.nativeBalance, nativeMetadata.decimals, priceInCents) : 0n;
                    tokens.push({
                        id: `${portfolioId}-native`,
                        portfolioId,
                        tokenAddress: '0x0000000000000000000000000000000000000000',
                        balance: chainData.nativeBalance,
                        metadata: nativeMetadata,
                        priceUSD: priceInCents,
                        valueUSD,
                        category: portfolio_1.AssetCategory.BLUECHIP,
                        lastUpdatedAt: new Date()
                    });
                }
                for (const tokenData of chainData.tokens) {
                    if (!tokenData.hasBalance || !tokenData.balance)
                        continue;
                    const metadataKey = `${chainData.chainId}:${tokenData.address.toLowerCase()}`;
                    const priceKey = metadataKey;
                    const metadata = tokenMetadata.get(metadataKey);
                    const priceData = tokenPrices.get(priceKey);
                    if (metadata && priceData) {
                        const priceInCents = (0, format_1.parsePriceToUSDCents)(priceData.priceUSD);
                        const valueUSD = (0, format_1.calculateTokenValue)(tokenData.balance, metadata.decimals, priceInCents);
                        const category = this.tokenBalanceService.categorizeToken(metadata);
                        tokens.push({
                            id: `${portfolioId}-${tokenData.address}`,
                            portfolioId,
                            tokenAddress: tokenData.address.toLowerCase(),
                            balance: tokenData.balance,
                            metadata,
                            priceUSD: priceInCents,
                            valueUSD,
                            category,
                            lastUpdatedAt: new Date()
                        });
                    }
                    else if (metadata) {
                        tokens.push({
                            id: `${portfolioId}-${tokenData.address}`,
                            portfolioId,
                            tokenAddress: tokenData.address.toLowerCase(),
                            balance: tokenData.balance,
                            metadata,
                            priceUSD: 0n,
                            valueUSD: 0n,
                            category: this.tokenBalanceService.categorizeToken(metadata),
                            lastUpdatedAt: new Date()
                        });
                    }
                }
                const totalValue = (0, format_1.aggregateTokenValues)(tokens);
                const composition = this.calculateAssetComposition(tokens, totalValue);
                const healthScore = this.calculateHealthScore(composition);
                portfolios.push({
                    id: portfolioId,
                    userId,
                    chainId: chainData.chainId,
                    totalValue,
                    healthScore,
                    lastSyncedAt: new Date(),
                    composition,
                    tokens,
                    lpPositions: []
                });
            }
            const duration = Date.now() - startTime;
            this.emit('aggregationComplete', {
                userId,
                portfolioCount: portfolios.length,
                tokenCount: portfolios.reduce((sum, p) => sum + p.tokens.length, 0),
                duration
            });
            return portfolios;
        }
        catch (error) {
            this.emit('aggregationError', { userId, error });
            throw error;
        }
    }
    calculateAssetComposition(tokens, totalValue) {
        const categoryMap = new Map();
        tokens.forEach(token => {
            const existing = categoryMap.get(token.category) || { value: 0n, count: 0 };
            categoryMap.set(token.category, {
                value: existing.value + token.valueUSD,
                count: existing.count + 1
            });
        });
        const composition = [];
        categoryMap.forEach((data, category) => {
            const percentage = totalValue > 0n
                ? Number(data.value * 10000n / totalValue) / 100
                : 0;
            composition.push({
                category,
                percentage,
                valueUSD: data.value,
                tokenCount: data.count
            });
        });
        composition.sort((a, b) => {
            if (a.valueUSD > b.valueUSD)
                return -1;
            if (a.valueUSD < b.valueUSD)
                return 1;
            return 0;
        });
        return composition;
    }
    calculateHealthScore(composition) {
        let score = 100;
        const stablecoinPercentage = composition
            .find(c => c.category === portfolio_1.AssetCategory.STABLECOIN)?.percentage || 0;
        const memePercentage = composition
            .find(c => c.category === portfolio_1.AssetCategory.MEME)?.percentage || 0;
        if (stablecoinPercentage > 80) {
            score -= 20;
        }
        else if (stablecoinPercentage < 10) {
            score -= 10;
        }
        if (memePercentage > 30) {
            score -= 30;
        }
        else if (memePercentage > 20) {
            score -= 15;
        }
        const categoryCount = composition.filter(c => c.percentage > 5).length;
        if (categoryCount < 2) {
            score -= 15;
        }
        else if (categoryCount > 4) {
            score += 10;
        }
        const largestPosition = Math.max(...composition.map(c => c.percentage));
        if (largestPosition > 70) {
            score -= 25;
        }
        else if (largestPosition > 50) {
            score -= 10;
        }
        return Math.max(0, Math.min(100, score));
    }
    async getPortfolioSummary(userId, walletAddress, chainIds) {
        const portfolios = await this.aggregatePortfolio(userId, walletAddress, chainIds);
        const totalValueUSD = portfolios.reduce((sum, p) => sum + p.totalValue, 0n);
        const chainBreakdown = (0, format_1.calculatePortfolioBreakdown)(portfolios.map(p => ({
            chainId: p.chainId,
            totalValue: p.totalValue
        })));
        const allTokens = portfolios.flatMap(p => p.tokens);
        // Separate native tokens (always include) from regular tokens
        const nativeTokens = allTokens.filter(token => token.tokenAddress === '0x0000000000000000000000000000000000000000');
        const regularTokens = allTokens.filter(token => token.tokenAddress !== '0x0000000000000000000000000000000000000000');
        // Get top regular tokens and combine with native tokens
        const topRegularTokens = regularTokens
            .sort((a, b) => {
            if (a.valueUSD > b.valueUSD)
                return -1;
            if (a.valueUSD < b.valueUSD)
                return 1;
            return 0;
        })
            .slice(0, 10 - nativeTokens.length); // Leave room for native tokens
        // Combine and sort all top tokens by value
        const topTokens = [...nativeTokens, ...topRegularTokens]
            .sort((a, b) => {
            if (a.valueUSD > b.valueUSD)
                return -1;
            if (a.valueUSD < b.valueUSD)
                return 1;
            return 0;
        });
        const aggregatedComposition = new Map();
        portfolios.forEach(portfolio => {
            portfolio.composition.forEach(comp => {
                const existing = aggregatedComposition.get(comp.category);
                if (existing) {
                    aggregatedComposition.set(comp.category, {
                        category: comp.category,
                        valueUSD: existing.valueUSD + comp.valueUSD,
                        tokenCount: existing.tokenCount + comp.tokenCount,
                        percentage: 0
                    });
                }
                else {
                    aggregatedComposition.set(comp.category, {
                        ...comp,
                        percentage: 0
                    });
                }
            });
        });
        const assetComposition = Array.from(aggregatedComposition.values()).map(comp => ({
            ...comp,
            percentage: totalValueUSD > 0n
                ? Number(comp.valueUSD * 10000n / totalValueUSD) / 100
                : 0
        }));
        return {
            totalValueUSD,
            chainBreakdown: chainBreakdown,
            topTokens,
            assetComposition
        };
    }
    async syncPortfolioData(portfolioId, walletAddress, chainId) {
        const startTime = Date.now();
        try {
            const [userId] = portfolioId.split('-');
            const portfolios = await this.aggregatePortfolio(userId, walletAddress, [chainId]);
            const portfolio = portfolios[0];
            return {
                success: true,
                portfolioId,
                tokensUpdated: portfolio.tokens.length,
                lpPositionsUpdated: 0,
                duration: Math.max(1, Date.now() - startTime)
            };
        }
        catch (error) {
            return {
                success: false,
                portfolioId,
                tokensUpdated: 0,
                lpPositionsUpdated: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                duration: Math.max(1, Date.now() - startTime)
            };
        }
    }
    async refreshPortfolio(userId, walletAddress, chainId, forceRefresh = false) {
        if (forceRefresh) {
            await this.priceService.clearCache();
        }
        const portfolios = await this.aggregatePortfolio(userId, walletAddress, [chainId]);
        return portfolios[0];
    }
}
exports.PortfolioAggregator = PortfolioAggregator;
//# sourceMappingURL=PortfolioAggregator.js.map