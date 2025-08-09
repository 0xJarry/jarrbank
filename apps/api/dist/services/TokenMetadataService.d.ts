import { ChainId } from '../../../../packages/shared/src/constants/chains';
import { TokenMetadata } from '../../../../packages/shared/src/types/portfolio';
import { RpcBatchManager } from './RpcBatchManager';
import { EventEmitter } from 'events';
export declare class TokenMetadataService extends EventEmitter {
    private redisClient;
    private rpcBatchManager;
    private metadataCacheTTL;
    constructor(rpcBatchManager: RpcBatchManager);
    getTokenMetadata(tokenAddress: string, chainId: ChainId): Promise<TokenMetadata | null>;
    private fetchAlchemyMetadata;
    private fetchOnChainMetadata;
    private decodeString;
    getBatchTokenMetadata(tokens: {
        address: string;
        chainId: ChainId;
    }[]): Promise<Map<string, TokenMetadata>>;
    getNativeTokenMetadata(chainId: ChainId): TokenMetadata;
    clearCache(): Promise<void>;
}
