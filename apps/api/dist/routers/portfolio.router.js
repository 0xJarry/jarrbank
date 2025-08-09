"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioRouter = void 0;
exports.initializePortfolioServices = initializePortfolioServices;
const zod_1 = require("zod");
const server_1 = require("@trpc/server");
const RpcBatchManager_1 = require("../services/RpcBatchManager");
const TokenBalanceService_1 = require("../services/TokenBalanceService");
const PriceService_1 = require("../services/PriceService");
const TokenMetadataService_1 = require("../services/TokenMetadataService");
const PortfolioAggregator_1 = require("../services/PortfolioAggregator");
const chains_1 = require("../../../../packages/shared/src/constants/chains");
const t = server_1.initTRPC.create();
const chainIdSchema = zod_1.z.nativeEnum(chains_1.CHAIN_IDS);
const getPortfolioInput = zod_1.z.object({
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    chainIds: zod_1.z.array(chainIdSchema).min(1).max(10)
});
const refreshPortfolioInput = zod_1.z.object({
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    chainId: chainIdSchema,
    forceRefresh: zod_1.z.boolean().optional()
});
const syncPortfolioInput = zod_1.z.object({
    portfolioId: zod_1.z.string(),
    walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    chainId: chainIdSchema
});
let portfolioAggregator = null;
function initializePortfolioServices(rpcProviderManager) {
    const rpcBatchManager = new RpcBatchManager_1.RpcBatchManager(rpcProviderManager);
    const tokenBalanceService = new TokenBalanceService_1.TokenBalanceService(rpcBatchManager);
    const priceService = new PriceService_1.PriceService();
    const metadataService = new TokenMetadataService_1.TokenMetadataService(rpcBatchManager);
    portfolioAggregator = new PortfolioAggregator_1.PortfolioAggregator(tokenBalanceService, priceService, metadataService);
}
exports.portfolioRouter = t.router({
    getPortfolio: t.procedure
        .input(getPortfolioInput)
        .query(async ({ input }) => {
        if (!portfolioAggregator) {
            throw new Error('Portfolio services not initialized');
        }
        const userId = `user-${input.walletAddress.slice(0, 8)}`;
        const portfolios = await portfolioAggregator.aggregatePortfolio(userId, input.walletAddress, input.chainIds);
        return {
            portfolios: portfolios.map(portfolio => ({
                ...portfolio,
                totalValue: portfolio.totalValue.toString(),
                composition: portfolio.composition.map(comp => ({
                    ...comp,
                    valueUSD: comp.valueUSD.toString()
                })),
                tokens: portfolio.tokens.map(token => ({
                    ...token,
                    balance: token.balance.toString(),
                    priceUSD: (Number(token.priceUSD) / 100).toString(),
                    valueUSD: token.valueUSD.toString()
                })),
                lpPositions: portfolio.lpPositions.map(lp => ({
                    ...lp,
                    amount0: lp.amount0.toString(),
                    amount1: lp.amount1.toString(),
                    lpTokenBalance: lp.lpTokenBalance.toString(),
                    valueUSD: lp.valueUSD.toString()
                }))
            }))
        };
    }),
    getPortfolioSummary: t.procedure
        .input(getPortfolioInput)
        .query(async ({ input }) => {
        if (!portfolioAggregator) {
            throw new Error('Portfolio services not initialized');
        }
        const userId = `user-${input.walletAddress.slice(0, 8)}`;
        const summary = await portfolioAggregator.getPortfolioSummary(userId, input.walletAddress, input.chainIds);
        return {
            totalValueUSD: summary.totalValueUSD.toString(),
            chainBreakdown: summary.chainBreakdown.map(chain => ({
                ...chain,
                valueUSD: chain.valueUSD.toString()
            })),
            topTokens: summary.topTokens.map(token => ({
                ...token,
                balance: token.balance.toString(),
                priceUSD: (Number(token.priceUSD) / 100).toString(),
                valueUSD: token.valueUSD.toString()
            })),
            assetComposition: summary.assetComposition.map(comp => ({
                ...comp,
                valueUSD: comp.valueUSD.toString()
            }))
        };
    }),
    refreshPortfolio: t.procedure
        .input(refreshPortfolioInput)
        .mutation(async ({ input }) => {
        if (!portfolioAggregator) {
            throw new Error('Portfolio services not initialized');
        }
        const userId = `user-${input.walletAddress.slice(0, 8)}`;
        const portfolio = await portfolioAggregator.refreshPortfolio(userId, input.walletAddress, input.chainId, input.forceRefresh);
        return {
            portfolio: {
                ...portfolio,
                totalValue: portfolio.totalValue.toString(),
                composition: portfolio.composition.map(comp => ({
                    ...comp,
                    valueUSD: comp.valueUSD.toString()
                })),
                tokens: portfolio.tokens.map(token => ({
                    ...token,
                    balance: token.balance.toString(),
                    priceUSD: (Number(token.priceUSD) / 100).toString(),
                    valueUSD: token.valueUSD.toString()
                })),
                lpPositions: portfolio.lpPositions.map(lp => ({
                    ...lp,
                    amount0: lp.amount0.toString(),
                    amount1: lp.amount1.toString(),
                    lpTokenBalance: lp.lpTokenBalance.toString(),
                    valueUSD: lp.valueUSD.toString()
                }))
            }
        };
    }),
    syncPortfolioData: t.procedure
        .input(syncPortfolioInput)
        .mutation(async ({ input }) => {
        if (!portfolioAggregator) {
            throw new Error('Portfolio services not initialized');
        }
        const result = await portfolioAggregator.syncPortfolioData(input.portfolioId, input.walletAddress, input.chainId);
        return result;
    })
});
//# sourceMappingURL=portfolio.router.js.map