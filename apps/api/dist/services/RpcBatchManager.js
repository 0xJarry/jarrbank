"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcBatchManager = void 0;
const events_1 = require("events");
class RpcBatchManager extends events_1.EventEmitter {
    providerManager;
    requestQueue = new Map();
    batchSize = 100;
    batchDelayMs = 50;
    pendingBatches = new Map();
    constructor(providerManager) {
        super();
        this.providerManager = providerManager;
    }
    async batchCall(batchRequest) {
        const { chainId, requests } = batchRequest;
        const startTime = Date.now();
        const provider = this.providerManager.getPrimaryProvider(chainId);
        try {
            const responses = await this.executeBatch(provider, requests);
            return {
                chainId,
                responses,
                provider: provider.name,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            this.emit('error', { chainId, provider: provider.name, error });
            const fallbackProvider = this.providerManager.getFallbackProvider(chainId);
            if (fallbackProvider) {
                try {
                    const responses = await this.executeBatch(fallbackProvider, requests);
                    this.emit('failover', {
                        chainId,
                        from: provider.name,
                        to: fallbackProvider.name
                    });
                    return {
                        chainId,
                        responses,
                        provider: fallbackProvider.name,
                        duration: Date.now() - startTime
                    };
                }
                catch (fallbackError) {
                    this.emit('error', {
                        chainId,
                        provider: fallbackProvider.name,
                        error: fallbackError
                    });
                    throw fallbackError;
                }
            }
            throw error;
        }
    }
    async executeBatch(provider, requests) {
        const batchRequest = requests.map(req => ({
            jsonrpc: '2.0',
            id: req.id,
            method: req.method,
            params: req.params
        }));
        const response = await fetch(provider.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...provider.headers
            },
            body: JSON.stringify(batchRequest)
        });
        if (!response.ok) {
            throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            return [data];
        }
        return data;
    }
    async getMultipleBalances(chainId, addresses) {
        const requests = addresses.map((address, index) => ({
            id: index,
            method: 'eth_getBalance',
            params: [address, 'latest']
        }));
        const batchResponse = await this.batchCall({
            chainId,
            requests
        });
        const balances = {};
        batchResponse.responses.forEach((response, index) => {
            if (!response.error && response.result) {
                const address = addresses[index];
                balances[address] = BigInt(response.result);
            }
        });
        return balances;
    }
    async getMultipleBlockNumbers(chainIds) {
        const results = {};
        await Promise.all(chainIds.map(async (chainId) => {
            const response = await this.batchCall({
                chainId,
                requests: [{
                        id: 1,
                        method: 'eth_blockNumber',
                        params: []
                    }]
            });
            if (response.responses[0]?.result) {
                results[chainId] = BigInt(response.responses[0].result);
            }
        }));
        return results;
    }
    async getMultipleTokenBalances(chainId, tokenAddress, walletAddresses) {
        const balanceOfSelector = '0x70a08231';
        const requests = walletAddresses.map((wallet, index) => {
            const data = balanceOfSelector + wallet.slice(2).padStart(64, '0');
            return {
                id: index,
                method: 'eth_call',
                params: [
                    {
                        to: tokenAddress,
                        data: data
                    },
                    'latest'
                ]
            };
        });
        const batchResponse = await this.batchCall({
            chainId,
            requests
        });
        const balances = {};
        batchResponse.responses.forEach((response, index) => {
            if (!response.error && response.result) {
                const wallet = walletAddresses[index];
                balances[wallet] = BigInt(response.result);
            }
        });
        return balances;
    }
    queueRequest(chainId, request) {
        if (!this.requestQueue.has(chainId)) {
            this.requestQueue.set(chainId, []);
        }
        this.requestQueue.get(chainId).push(request);
        if (this.pendingBatches.has(chainId)) {
            clearTimeout(this.pendingBatches.get(chainId));
        }
        const timeout = setTimeout(() => {
            this.flushQueue(chainId);
        }, this.batchDelayMs);
        this.pendingBatches.set(chainId, timeout);
        const queue = this.requestQueue.get(chainId);
        if (queue.length >= this.batchSize) {
            this.flushQueue(chainId);
        }
    }
    async flushQueue(chainId) {
        const queue = this.requestQueue.get(chainId);
        if (!queue || queue.length === 0)
            return;
        this.requestQueue.set(chainId, []);
        if (this.pendingBatches.has(chainId)) {
            clearTimeout(this.pendingBatches.get(chainId));
            this.pendingBatches.delete(chainId);
        }
        try {
            await this.batchCall({
                chainId,
                requests: queue
            });
        }
        catch (error) {
            this.emit('queueError', { chainId, error, requests: queue });
        }
    }
    async flushAllQueues() {
        const chains = Array.from(this.requestQueue.keys());
        await Promise.all(chains.map(chainId => this.flushQueue(chainId)));
    }
    getQueueDepth(chainId) {
        if (chainId) {
            return this.requestQueue.get(chainId)?.length || 0;
        }
        let total = 0;
        this.requestQueue.forEach(queue => {
            total += queue.length;
        });
        return total;
    }
    setBatchSize(size) {
        this.batchSize = Math.max(1, Math.min(size, 1000));
    }
    setBatchDelay(delayMs) {
        this.batchDelayMs = Math.max(0, Math.min(delayMs, 5000));
    }
}
exports.RpcBatchManager = RpcBatchManager;
//# sourceMappingURL=RpcBatchManager.js.map