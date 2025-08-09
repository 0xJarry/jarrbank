import { RpcBatchManager } from './RpcBatchManager';
import { ChainId } from '../../../../packages/shared/src/constants/chains';
import { TokenMetadata, AssetCategory } from '../../../../packages/shared/src/types/portfolio';
import { EventEmitter } from 'events';
interface TokenDetectionResult {
    address: string;
    hasBalance: boolean;
    balance?: bigint;
}
interface ChainTokenBalances {
    chainId: ChainId;
    walletAddress: string;
    nativeBalance: bigint;
    tokens: TokenDetectionResult[];
}
export declare class TokenBalanceService extends EventEmitter {
    private rpcBatchManager;
    private redisClient;
    private commonTokens;
    constructor(rpcBatchManager: RpcBatchManager);
    private initializeCommonTokens;
    detectTokenBalances(walletAddress: string, chainIds: ChainId[]): Promise<ChainTokenBalances[]>;
    private detectChainTokens;
    private getNativeBalance;
    private getTokenBalance;
    private fetchAlchemyTokenBalances;
    batchFetchTokenBalances(walletAddress: string, tokenAddresses: string[], chainId: ChainId): Promise<Map<string, bigint>>;
    categorizeToken(metadata: TokenMetadata): AssetCategory;
    getFormattedBalances(walletAddress: string, chainIds: ChainId[]): Promise<{
        chains: ChainTokenBalances[];
        totalTokensFound: number;
        hasBalances: boolean;
    }>;
}
export {};
