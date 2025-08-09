"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachedRpcBatchManager = void 0;
const RpcBatchManager_1 = require("./RpcBatchManager");
class CachedRpcBatchManager extends RpcBatchManager_1.RpcBatchManager {
    cache;
    constructor(providerManager, cache) {
        super(providerManager);
        this.cache = cache;
    }
    async getMultipleBalances(chainId, addresses) {
        const balances = {};
        const uncachedAddresses = [];
        // Check cache for each address
        await Promise.all(addresses.map(async (address) => {
            const cached = await this.cache.getCachedBalance(chainId, address);
            if (cached !== null) {
                balances[address] = cached;
            }
            else {
                uncachedAddresses.push(address);
            }
        }));
        // Fetch uncached balances
        if (uncachedAddresses.length > 0) {
            const freshBalances = await super.getMultipleBalances(chainId, uncachedAddresses);
            // Cache and merge results
            await Promise.all(Object.entries(freshBalances).map(async ([address, balance]) => {
                await this.cache.setCachedBalance(chainId, address, balance);
                balances[address] = balance;
            }));
        }
        return balances;
    }
    async getMultipleTokenBalances(chainId, tokenAddress, walletAddresses) {
        const balances = {};
        const uncachedWallets = [];
        // Check cache for each wallet
        await Promise.all(walletAddresses.map(async (wallet) => {
            const cached = await this.cache.getCachedTokenBalance(chainId, tokenAddress, wallet);
            if (cached !== null) {
                balances[wallet] = cached;
            }
            else {
                uncachedWallets.push(wallet);
            }
        }));
        // Fetch uncached token balances
        if (uncachedWallets.length > 0) {
            const freshBalances = await super.getMultipleTokenBalances(chainId, tokenAddress, uncachedWallets);
            // Cache and merge results
            await Promise.all(Object.entries(freshBalances).map(async ([wallet, balance]) => {
                await this.cache.setCachedTokenBalance(chainId, tokenAddress, wallet, balance);
                balances[wallet] = balance;
            }));
        }
        return balances;
    }
    async getMultipleBlockNumbers(chainIds) {
        const blockNumbers = {};
        const uncachedChains = [];
        // Check cache for each chain
        await Promise.all(chainIds.map(async (chainId) => {
            const cached = await this.cache.getCachedBlockNumber(chainId);
            if (cached !== null) {
                blockNumbers[chainId] = cached;
            }
            else {
                uncachedChains.push(chainId);
            }
        }));
        // Fetch uncached block numbers
        if (uncachedChains.length > 0) {
            const freshBlockNumbers = await super.getMultipleBlockNumbers(uncachedChains);
            // Cache and merge results
            await Promise.all(Object.entries(freshBlockNumbers).map(async ([chainIdStr, blockNumber]) => {
                const chainId = Number(chainIdStr);
                await this.cache.setCachedBlockNumber(chainId, blockNumber);
                blockNumbers[chainId] = blockNumber;
            }));
        }
        return blockNumbers;
    }
    async batchCall(batchRequest) {
        // For generic batch calls, we'll cache based on the request signature
        const cacheKey = this.generateBatchCacheKey(batchRequest);
        const cached = await this.cache.getCachedData(cacheKey);
        if (cached) {
            return cached.data;
        }
        const response = await super.batchCall(batchRequest);
        // Cache successful responses
        if (response.responses.every(r => !r.error)) {
            await this.cache.setCachedData(cacheKey, response, 60, // 60 seconds for generic RPC responses
            batchRequest.chainId);
        }
        return response;
    }
    generateBatchCacheKey(batchRequest) {
        const { chainId, requests } = batchRequest;
        // Create a deterministic key based on the requests
        const requestsSignature = requests
            .map(r => `${r.method}:${JSON.stringify(r.params)}`)
            .sort()
            .join('|');
        const hash = this.simpleHash(requestsSignature);
        return `jarrbank:batch:chain:${chainId}:${hash}`;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }
    async invalidateChainCache(chainId) {
        await this.cache.invalidateCache(`jarrbank:*:chain:${chainId}:*`);
    }
    async getCacheStatus() {
        return {
            connected: this.cache.getConnectionStatus(),
            stats: this.cache.getCacheStats()
        };
    }
}
exports.CachedRpcBatchManager = CachedRpcBatchManager;
//# sourceMappingURL=CachedRpcBatchManager.js.map