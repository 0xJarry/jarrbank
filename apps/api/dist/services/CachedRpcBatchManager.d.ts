import { RpcBatchManager, BatchRequest, BatchResponse } from './RpcBatchManager';
import { RedisCache } from '../db/redis';
import { RpcProviderManager } from '../../../../packages/web3/src/rpc/providers';
import { ChainId } from '../../../../packages/shared/src/constants/chains';
export declare class CachedRpcBatchManager extends RpcBatchManager {
    private cache;
    constructor(providerManager: RpcProviderManager, cache: RedisCache);
    getMultipleBalances(chainId: ChainId, addresses: string[]): Promise<Record<string, bigint>>;
    getMultipleTokenBalances(chainId: ChainId, tokenAddress: string, walletAddresses: string[]): Promise<Record<string, bigint>>;
    getMultipleBlockNumbers(chainIds: ChainId[]): Promise<Record<ChainId, bigint>>;
    batchCall(batchRequest: BatchRequest): Promise<BatchResponse>;
    private generateBatchCacheKey;
    private simpleHash;
    invalidateChainCache(chainId: ChainId): Promise<void>;
    getCacheStatus(): Promise<{
        connected: boolean;
        stats: any;
    }>;
}
