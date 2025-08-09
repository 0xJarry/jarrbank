import { z } from 'zod';
import { initTRPC } from '@trpc/server';
import { RpcProviderManager } from '../../../../packages/web3/src/rpc/providers';
import { RpcBatchManager } from '../services/RpcBatchManager';
import { TokenBalanceService } from '../services/TokenBalanceService';
import { PriceService } from '../services/PriceService';
import { TokenMetadataService } from '../services/TokenMetadataService';
import { PortfolioAggregator } from '../services/PortfolioAggregator';
import { ChainId, CHAIN_IDS } from '../../../../packages/shared/src/constants/chains';
import { getRedisClient } from '../db/redis';

const t = initTRPC.create();

const chainIdSchema = z.nativeEnum(CHAIN_IDS);

const getPortfolioInput = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainIds: z.array(chainIdSchema).min(1).max(10)
});

const refreshPortfolioInput = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: chainIdSchema,
  forceRefresh: z.boolean().optional()
});

const syncPortfolioInput = z.object({
  portfolioId: z.string(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: chainIdSchema
});

let portfolioAggregator: PortfolioAggregator | null = null;

export function initializePortfolioServices(rpcProviderManager: RpcProviderManager): void {
  const rpcBatchManager = new RpcBatchManager(rpcProviderManager);
  const tokenBalanceService = new TokenBalanceService(rpcBatchManager);
  const priceService = new PriceService();
  const metadataService = new TokenMetadataService(rpcBatchManager);
  
  portfolioAggregator = new PortfolioAggregator(
    tokenBalanceService,
    priceService,
    metadataService
  );
}

export const portfolioRouter = t.router({
  getPortfolio: t.procedure
    .input(getPortfolioInput)
    .query(async ({ input }) => {
      if (!portfolioAggregator) {
        throw new Error('Portfolio services not initialized');
      }

      const userId = `user-${input.walletAddress.slice(0, 8)}`;
      
      const portfolios = await portfolioAggregator.aggregatePortfolio(
        userId,
        input.walletAddress,
        input.chainIds
      );

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
      
      const summary = await portfolioAggregator.getPortfolioSummary(
        userId,
        input.walletAddress,
        input.chainIds
      );

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
      
      const portfolio = await portfolioAggregator.refreshPortfolio(
        userId,
        input.walletAddress,
        input.chainId,
        input.forceRefresh
      );

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

      const result = await portfolioAggregator.syncPortfolioData(
        input.portfolioId,
        input.walletAddress,
        input.chainId
      );

      return result;
    })
});

export type PortfolioRouter = typeof portfolioRouter;