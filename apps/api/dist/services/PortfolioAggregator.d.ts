import { ChainId } from '../../../../packages/shared/src/constants/chains';
import { Portfolio, PortfolioSummary, SyncResult } from '../../../../packages/shared/src/types/portfolio';
import { TokenBalanceService } from './TokenBalanceService';
import { PriceService } from './PriceService';
import { TokenMetadataService } from './TokenMetadataService';
import { EventEmitter } from 'events';
export declare class PortfolioAggregator extends EventEmitter {
    private tokenBalanceService;
    private priceService;
    private metadataService;
    constructor(tokenBalanceService: TokenBalanceService, priceService: PriceService, metadataService: TokenMetadataService);
    aggregatePortfolio(userId: string, walletAddress: string, chainIds: ChainId[]): Promise<Portfolio[]>;
    private calculateAssetComposition;
    private calculateHealthScore;
    getPortfolioSummary(userId: string, walletAddress: string, chainIds: ChainId[]): Promise<PortfolioSummary>;
    syncPortfolioData(portfolioId: string, walletAddress: string, chainId: ChainId): Promise<SyncResult>;
    refreshPortfolio(userId: string, walletAddress: string, chainId: ChainId, forceRefresh?: boolean): Promise<Portfolio>;
}
