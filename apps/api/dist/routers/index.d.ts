export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: object;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    portfolio: import("@trpc/server").TRPCBuiltRouter<{
        ctx: object;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getPortfolio: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                walletAddress?: string;
                chainIds?: (1 | 42161 | 43114)[];
            };
            output: {
                portfolios: {
                    totalValue: string;
                    composition: {
                        valueUSD: string;
                        category: import("@jarrbank/shared/src/types/portfolio").AssetCategory;
                        percentage: number;
                        tokenCount: number;
                    }[];
                    tokens: {
                        balance: string;
                        priceUSD: string;
                        valueUSD: string;
                        id: string;
                        portfolioId: string;
                        tokenAddress: string;
                        metadata: import("@jarrbank/shared/src/types/portfolio").TokenMetadata;
                        category: import("@jarrbank/shared/src/types/portfolio").AssetCategory;
                        lastUpdatedAt: Date;
                    }[];
                    lpPositions: {
                        amount0: string;
                        amount1: string;
                        lpTokenBalance: string;
                        valueUSD: string;
                        id: string;
                        portfolioId: string;
                        protocol: string;
                        poolAddress: string;
                        token0: import("@jarrbank/shared/src/types/portfolio").TokenMetadata;
                        token1: import("@jarrbank/shared/src/types/portfolio").TokenMetadata;
                        apy?: number;
                        lastUpdatedAt: Date;
                    }[];
                    id: string;
                    userId: string;
                    chainId: import("@jarrbank/shared/src/constants/chains").ChainId;
                    healthScore: number;
                    lastSyncedAt: Date;
                }[];
            };
            meta: object;
        }>;
        getPortfolioSummary: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                walletAddress?: string;
                chainIds?: (1 | 42161 | 43114)[];
            };
            output: {
                totalValueUSD: string;
                chainBreakdown: {
                    valueUSD: string;
                    chainId: import("@jarrbank/shared/src/constants/chains").ChainId;
                    percentage: number;
                }[];
                topTokens: {
                    balance: string;
                    priceUSD: string;
                    valueUSD: string;
                    id: string;
                    portfolioId: string;
                    tokenAddress: string;
                    metadata: import("@jarrbank/shared/src/types/portfolio").TokenMetadata;
                    category: import("@jarrbank/shared/src/types/portfolio").AssetCategory;
                    lastUpdatedAt: Date;
                }[];
                assetComposition: {
                    valueUSD: string;
                    category: import("@jarrbank/shared/src/types/portfolio").AssetCategory;
                    percentage: number;
                    tokenCount: number;
                }[];
            };
            meta: object;
        }>;
        refreshPortfolio: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                chainId?: 1 | 42161 | 43114;
                walletAddress?: string;
                forceRefresh?: boolean;
            };
            output: {
                portfolio: {
                    totalValue: string;
                    composition: {
                        valueUSD: string;
                        category: import("@jarrbank/shared/src/types/portfolio").AssetCategory;
                        percentage: number;
                        tokenCount: number;
                    }[];
                    tokens: {
                        balance: string;
                        priceUSD: string;
                        valueUSD: string;
                        id: string;
                        portfolioId: string;
                        tokenAddress: string;
                        metadata: import("@jarrbank/shared/src/types/portfolio").TokenMetadata;
                        category: import("@jarrbank/shared/src/types/portfolio").AssetCategory;
                        lastUpdatedAt: Date;
                    }[];
                    lpPositions: {
                        amount0: string;
                        amount1: string;
                        lpTokenBalance: string;
                        valueUSD: string;
                        id: string;
                        portfolioId: string;
                        protocol: string;
                        poolAddress: string;
                        token0: import("@jarrbank/shared/src/types/portfolio").TokenMetadata;
                        token1: import("@jarrbank/shared/src/types/portfolio").TokenMetadata;
                        apy?: number;
                        lastUpdatedAt: Date;
                    }[];
                    id: string;
                    userId: string;
                    chainId: import("@jarrbank/shared/src/constants/chains").ChainId;
                    healthScore: number;
                    lastSyncedAt: Date;
                };
            };
            meta: object;
        }>;
        syncPortfolioData: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                chainId?: 1 | 42161 | 43114;
                walletAddress?: string;
                portfolioId?: string;
            };
            output: import("@jarrbank/shared/src/types/portfolio").SyncResult;
            meta: object;
        }>;
    }>>;
}>>;
export type AppRouter = typeof appRouter;
