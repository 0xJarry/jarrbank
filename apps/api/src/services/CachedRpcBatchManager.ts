import { RpcBatchManager, BatchRequest, BatchResponse } from './RpcBatchManager';
import { RedisCache } from '../db/redis';
import { RpcProviderManager } from '../../../../packages/web3/src/rpc/providers';
import { ChainId } from '../../../../packages/shared/src/constants/chains';

export class CachedRpcBatchManager extends RpcBatchManager {
  private cache: RedisCache;

  constructor(providerManager: RpcProviderManager, cache: RedisCache) {
    super(providerManager);
    this.cache = cache;
  }

  async getMultipleBalances(
    chainId: ChainId,
    addresses: string[]
  ): Promise<Record<string, bigint>> {
    const balances: Record<string, bigint> = {};
    const uncachedAddresses: string[] = [];

    // Check cache for each address
    await Promise.all(
      addresses.map(async (address) => {
        const cached = await this.cache.getCachedBalance(chainId, address);
        if (cached !== null) {
          balances[address] = cached;
        } else {
          uncachedAddresses.push(address);
        }
      })
    );

    // Fetch uncached balances
    if (uncachedAddresses.length > 0) {
      const freshBalances = await super.getMultipleBalances(chainId, uncachedAddresses);
      
      // Cache and merge results
      await Promise.all(
        Object.entries(freshBalances).map(async ([address, balance]) => {
          await this.cache.setCachedBalance(chainId, address, balance);
          balances[address] = balance;
        })
      );
    }

    return balances;
  }

  async getMultipleTokenBalances(
    chainId: ChainId,
    tokenAddress: string,
    walletAddresses: string[]
  ): Promise<Record<string, bigint>> {
    const balances: Record<string, bigint> = {};
    const uncachedWallets: string[] = [];

    // Check cache for each wallet
    await Promise.all(
      walletAddresses.map(async (wallet) => {
        const cached = await this.cache.getCachedTokenBalance(
          chainId,
          tokenAddress,
          wallet
        );
        if (cached !== null) {
          balances[wallet] = cached;
        } else {
          uncachedWallets.push(wallet);
        }
      })
    );

    // Fetch uncached token balances
    if (uncachedWallets.length > 0) {
      const freshBalances = await super.getMultipleTokenBalances(
        chainId,
        tokenAddress,
        uncachedWallets
      );
      
      // Cache and merge results
      await Promise.all(
        Object.entries(freshBalances).map(async ([wallet, balance]) => {
          await this.cache.setCachedTokenBalance(
            chainId,
            tokenAddress,
            wallet,
            balance
          );
          balances[wallet] = balance;
        })
      );
    }

    return balances;
  }

  async getMultipleBlockNumbers(chainIds: ChainId[]): Promise<Record<ChainId, bigint>> {
    const blockNumbers: Record<ChainId, bigint> = {} as Record<ChainId, bigint>;
    const uncachedChains: ChainId[] = [];

    // Check cache for each chain
    await Promise.all(
      chainIds.map(async (chainId) => {
        const cached = await this.cache.getCachedBlockNumber(chainId);
        if (cached !== null) {
          blockNumbers[chainId] = cached;
        } else {
          uncachedChains.push(chainId);
        }
      })
    );

    // Fetch uncached block numbers
    if (uncachedChains.length > 0) {
      const freshBlockNumbers = await super.getMultipleBlockNumbers(uncachedChains);
      
      // Cache and merge results
      await Promise.all(
        Object.entries(freshBlockNumbers).map(async ([chainIdStr, blockNumber]) => {
          const chainId = Number(chainIdStr) as ChainId;
          await this.cache.setCachedBlockNumber(chainId, blockNumber);
          blockNumbers[chainId] = blockNumber;
        })
      );
    }

    return blockNumbers;
  }

  async batchCall(batchRequest: BatchRequest): Promise<BatchResponse> {
    // For generic batch calls, we'll cache based on the request signature
    const cacheKey = this.generateBatchCacheKey(batchRequest);
    
    const cached = await this.cache.getCachedData<BatchResponse>(cacheKey);
    if (cached) {
      return cached.data;
    }

    const response = await super.batchCall(batchRequest);
    
    // Cache successful responses
    if (response.responses.every(r => !r.error)) {
      await this.cache.setCachedData(
        cacheKey,
        response,
        60, // 60 seconds for generic RPC responses
        batchRequest.chainId
      );
    }

    return response;
  }

  private generateBatchCacheKey(batchRequest: BatchRequest): string {
    const { chainId, requests } = batchRequest;
    
    // Create a deterministic key based on the requests
    const requestsSignature = requests
      .map(r => `${r.method}:${JSON.stringify(r.params)}`)
      .sort()
      .join('|');
    
    const hash = this.simpleHash(requestsSignature);
    
    return `jarrbank:batch:chain:${chainId}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async invalidateChainCache(chainId: ChainId): Promise<void> {
    await this.cache.invalidateCache(`jarrbank:*:chain:${chainId}:*`);
  }

  async getCacheStatus(): Promise<{
    connected: boolean;
    stats: any;
  }> {
    return {
      connected: this.cache.getConnectionStatus(),
      stats: this.cache.getCacheStats()
    };
  }
}