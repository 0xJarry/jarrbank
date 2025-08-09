import { RpcProviderManager } from '../../../../packages/web3/src/rpc/providers';
import { ChainId } from '../../../../packages/shared/src/constants/chains';
import { EventEmitter } from 'events';
export interface RpcRequest {
    id: number | string;
    method: string;
    params: any[];
}
export interface RpcResponse {
    id: number | string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
export interface BatchRequest {
    chainId: ChainId;
    requests: RpcRequest[];
}
export interface BatchResponse {
    chainId: ChainId;
    responses: RpcResponse[];
    provider: string;
    duration: number;
}
export declare class RpcBatchManager extends EventEmitter {
    protected providerManager: RpcProviderManager;
    private requestQueue;
    private batchSize;
    private batchDelayMs;
    private pendingBatches;
    constructor(providerManager: RpcProviderManager);
    batchCall(batchRequest: BatchRequest): Promise<BatchResponse>;
    private executeBatch;
    getMultipleBalances(chainId: ChainId, addresses: string[]): Promise<Record<string, bigint>>;
    getMultipleBlockNumbers(chainIds: ChainId[]): Promise<Record<ChainId, bigint>>;
    getMultipleTokenBalances(chainId: ChainId, tokenAddress: string, walletAddresses: string[]): Promise<Record<string, bigint>>;
    queueRequest(chainId: ChainId, request: RpcRequest): void;
    private flushQueue;
    flushAllQueues(): Promise<void>;
    getQueueDepth(chainId?: ChainId): number;
    setBatchSize(size: number): void;
    setBatchDelay(delayMs: number): void;
}
