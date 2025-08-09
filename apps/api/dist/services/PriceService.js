"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const chains_1 = require("../../../../packages/shared/src/constants/chains");
const redis_1 = require("../db/redis");
const events_1 = require("events");
class PriceService extends events_1.EventEmitter {
    redisClient;
    providers;
    priceCacheTTL = 15; // 15 seconds
    constructor() {
        super();
        this.redisClient = (0, redis_1.getRedisClient)();
        this.providers = [
            this.createMoralisProvider(),
            this.createDefiLlamaProvider(),
            this.createCoinMarketCapProvider()
        ];
    }
    createMoralisProvider() {
        return {
            name: 'moralis',
            fetchPrice: async (tokenAddress, chainId) => {
                const apiKey = process.env.MORALIS_API_KEY;
                if (!apiKey)
                    return null;
                try {
                    const chainMap = {
                        [chains_1.CHAIN_IDS.ETHEREUM]: '0x1',
                        [chains_1.CHAIN_IDS.ARBITRUM]: '0xa4b1',
                        [chains_1.CHAIN_IDS.AVALANCHE]: '0xa86a'
                    };
                    const chain = chainMap[chainId];
                    if (!chain)
                        return null;
                    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/price?chain=${chain}`;
                    const response = await fetch(url, {
                        headers: {
                            'X-API-Key': apiKey,
                            'Accept': 'application/json'
                        }
                    });
                    if (!response.ok) {
                        if (response.status === 404)
                            return null;
                        throw new Error(`Moralis API error: ${response.status}`);
                    }
                    const data = await response.json();
                    return data.usdPrice || null;
                }
                catch (error) {
                    this.emit('providerError', { provider: 'moralis', error, tokenAddress, chainId });
                    return null;
                }
            },
            fetchBatchPrices: async (tokens) => {
                const prices = new Map();
                const apiKey = process.env.MORALIS_API_KEY;
                if (!apiKey)
                    return prices;
                const chainGroups = new Map();
                tokens.forEach(token => {
                    if (!chainGroups.has(token.chainId)) {
                        chainGroups.set(token.chainId, []);
                    }
                    chainGroups.get(token.chainId).push(token);
                });
                await Promise.all(Array.from(chainGroups.entries()).map(async ([chainId, chainTokens]) => {
                    const chainMap = {
                        [chains_1.CHAIN_IDS.ETHEREUM]: '0x1',
                        [chains_1.CHAIN_IDS.ARBITRUM]: '0xa4b1',
                        [chains_1.CHAIN_IDS.AVALANCHE]: '0xa86a'
                    };
                    const chain = chainMap[chainId];
                    if (!chain)
                        return;
                    const batchSize = 25;
                    for (let i = 0; i < chainTokens.length; i += batchSize) {
                        const batch = chainTokens.slice(i, i + batchSize);
                        await Promise.all(batch.map(async (token) => {
                            const price = await this.providers[0].fetchPrice(token.address, token.chainId);
                            if (price !== null) {
                                prices.set(`${token.chainId}:${token.address.toLowerCase()}`, price);
                            }
                        }));
                    }
                }));
                return prices;
            }
        };
    }
    createDefiLlamaProvider() {
        return {
            name: 'defiLlama',
            fetchPrice: async (tokenAddress, chainId) => {
                try {
                    const chainMap = {
                        [chains_1.CHAIN_IDS.ETHEREUM]: 'ethereum',
                        [chains_1.CHAIN_IDS.ARBITRUM]: 'arbitrum',
                        [chains_1.CHAIN_IDS.AVALANCHE]: 'avax'
                    };
                    const chain = chainMap[chainId];
                    if (!chain)
                        return null;
                    const coinId = `${chain}:${tokenAddress}`;
                    const url = `https://coins.llama.fi/prices/current/${coinId}`;
                    const response = await fetch(url);
                    if (!response.ok) {
                        if (response.status === 404)
                            return null;
                        throw new Error(`DefiLlama API error: ${response.status}`);
                    }
                    const data = await response.json();
                    return data.coins?.[coinId]?.price || null;
                }
                catch (error) {
                    this.emit('providerError', { provider: 'defiLlama', error, tokenAddress, chainId });
                    return null;
                }
            },
            fetchBatchPrices: async (tokens) => {
                const prices = new Map();
                try {
                    const chainMap = {
                        [chains_1.CHAIN_IDS.ETHEREUM]: 'ethereum',
                        [chains_1.CHAIN_IDS.ARBITRUM]: 'arbitrum',
                        [chains_1.CHAIN_IDS.AVALANCHE]: 'avax'
                    };
                    const coinIds = tokens
                        .map(token => {
                        const chain = chainMap[token.chainId];
                        return chain ? `${chain}:${token.address}` : null;
                    })
                        .filter(Boolean);
                    if (coinIds.length === 0)
                        return prices;
                    const batchSize = 50;
                    for (let i = 0; i < coinIds.length; i += batchSize) {
                        const batch = coinIds.slice(i, i + batchSize);
                        const url = `https://coins.llama.fi/prices/current/${batch.join(',')}`;
                        const response = await fetch(url);
                        if (response.ok) {
                            const data = await response.json();
                            Object.entries(data.coins || {}).forEach(([coinId, coinData]) => {
                                const [chain, address] = coinId.split(':');
                                const chainId = Object.entries(chainMap).find(([_, v]) => v === chain)?.[0];
                                if (chainId && coinData.price) {
                                    prices.set(`${chainId}:${address.toLowerCase()}`, coinData.price);
                                }
                            });
                        }
                    }
                }
                catch (error) {
                    this.emit('providerError', { provider: 'defiLlama', error });
                }
                return prices;
            }
        };
    }
    createCoinMarketCapProvider() {
        return {
            name: 'coinmarketcap',
            fetchPrice: async (tokenAddress, chainId) => {
                const apiKey = process.env.COINMARKETCAP_API_KEY;
                if (!apiKey)
                    return null;
                try {
                    const platformMap = {
                        [chains_1.CHAIN_IDS.ETHEREUM]: 1,
                        [chains_1.CHAIN_IDS.ARBITRUM]: 42161,
                        [chains_1.CHAIN_IDS.AVALANCHE]: 43114
                    };
                    const platformId = platformMap[chainId];
                    if (!platformId)
                        return null;
                    const url = 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest';
                    const params = new URLSearchParams({
                        address: tokenAddress,
                        aux: 'platform'
                    });
                    const response = await fetch(`${url}?${params}`, {
                        headers: {
                            'X-CMC_PRO_API_KEY': apiKey,
                            'Accept': 'application/json'
                        }
                    });
                    if (!response.ok) {
                        if (response.status === 404)
                            return null;
                        throw new Error(`CoinMarketCap API error: ${response.status}`);
                    }
                    const data = await response.json();
                    const tokenData = Object.values(data.data || {})[0];
                    return tokenData?.quote?.USD?.price || null;
                }
                catch (error) {
                    this.emit('providerError', { provider: 'coinmarketcap', error, tokenAddress, chainId });
                    return null;
                }
            },
            fetchBatchPrices: async (tokens) => {
                const prices = new Map();
                const apiKey = process.env.COINMARKETCAP_API_KEY;
                if (!apiKey)
                    return prices;
                const uniqueAddresses = new Set(tokens.map(t => t.address.toLowerCase()));
                if (uniqueAddresses.size === 0)
                    return prices;
                try {
                    const url = 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest';
                    const params = new URLSearchParams({
                        address: Array.from(uniqueAddresses).join(','),
                        aux: 'platform'
                    });
                    const response = await fetch(`${url}?${params}`, {
                        headers: {
                            'X-CMC_PRO_API_KEY': apiKey,
                            'Accept': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        Object.values(data.data || {}).forEach((tokenData) => {
                            const address = tokenData.platform?.token_address;
                            const price = tokenData.quote?.USD?.price;
                            if (address && price) {
                                tokens.forEach(token => {
                                    if (token.address.toLowerCase() === address.toLowerCase()) {
                                        prices.set(`${token.chainId}:${address.toLowerCase()}`, price);
                                    }
                                });
                            }
                        });
                    }
                }
                catch (error) {
                    this.emit('providerError', { provider: 'coinmarketcap', error });
                }
                return prices;
            }
        };
    }
    async getTokenPrice(tokenAddress, chainId, skipCache = false) {
        const cacheKey = `price:${chainId}:${tokenAddress.toLowerCase()}`;
        if (!skipCache) {
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                return {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp)
                };
            }
        }
        for (const provider of this.providers) {
            const price = await provider.fetchPrice(tokenAddress, chainId);
            if (price !== null) {
                const priceData = {
                    tokenAddress: tokenAddress.toLowerCase(),
                    chainId,
                    priceUSD: price,
                    source: provider.name,
                    timestamp: new Date()
                };
                await this.redisClient.setex(cacheKey, this.priceCacheTTL, JSON.stringify(priceData));
                this.emit('priceResolved', { provider: provider.name, tokenAddress, chainId, price });
                return priceData;
            }
        }
        this.emit('priceNotFound', { tokenAddress, chainId });
        return null;
    }
    async getBatchTokenPrices(tokens) {
        const pricesMap = new Map();
        const uncachedTokens = [];
        await Promise.all(tokens.map(async (token) => {
            const cacheKey = `price:${token.chainId}:${token.address.toLowerCase()}`;
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                pricesMap.set(`${token.chainId}:${token.address.toLowerCase()}`, {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp)
                });
            }
            else {
                uncachedTokens.push(token);
            }
        }));
        if (uncachedTokens.length === 0) {
            return pricesMap;
        }
        for (const provider of this.providers) {
            const remainingTokens = uncachedTokens.filter(token => !pricesMap.has(`${token.chainId}:${token.address.toLowerCase()}`));
            if (remainingTokens.length === 0)
                break;
            const batchPrices = await provider.fetchBatchPrices(remainingTokens);
            await Promise.all(Array.from(batchPrices.entries()).map(async ([key, price]) => {
                const [chainId, address] = key.split(':');
                const priceData = {
                    tokenAddress: address,
                    chainId: Number(chainId),
                    priceUSD: price,
                    source: provider.name,
                    timestamp: new Date()
                };
                pricesMap.set(key, priceData);
                const cacheKey = `price:${chainId}:${address}`;
                await this.redisClient.setex(cacheKey, this.priceCacheTTL, JSON.stringify(priceData));
            }));
        }
        const missingTokens = uncachedTokens.filter(token => !pricesMap.has(`${token.chainId}:${token.address.toLowerCase()}`));
        if (missingTokens.length > 0) {
            this.emit('pricesNotFound', { tokens: missingTokens });
        }
        return pricesMap;
    }
    async getNativeTokenPrices() {
        const prices = new Map();
        const nativeTokens = [
            { symbol: 'ETH', coinId: 'ethereum', chainIds: [chains_1.CHAIN_IDS.ETHEREUM, chains_1.CHAIN_IDS.ARBITRUM] },
            { symbol: 'AVAX', coinId: 'avalanche-2', chainIds: [chains_1.CHAIN_IDS.AVALANCHE] }
        ];
        await Promise.all(nativeTokens.map(async ({ symbol, coinId, chainIds }) => {
            const cacheKey = `price:native:${symbol}`;
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                const price = parseFloat(cached);
                chainIds.forEach(chainId => prices.set(chainId, price));
                return;
            }
            try {
                const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
                if (response.ok) {
                    const data = await response.json();
                    const price = data[coinId]?.usd;
                    if (price) {
                        chainIds.forEach(chainId => prices.set(chainId, price));
                        await this.redisClient.setex(cacheKey, this.priceCacheTTL, price.toString());
                    }
                }
            }
            catch (error) {
                this.emit('error', { method: 'getNativeTokenPrices', symbol, error });
            }
        }));
        return prices;
    }
    async clearCache() {
        await this.redisClient.flushdb();
    }
}
exports.PriceService = PriceService;
//# sourceMappingURL=PriceService.js.map