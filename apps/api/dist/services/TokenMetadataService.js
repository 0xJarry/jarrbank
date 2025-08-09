"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenMetadataService = void 0;
const chains_1 = require("../../../../packages/shared/src/constants/chains");
const redis_1 = require("../db/redis");
const events_1 = require("events");
class TokenMetadataService extends events_1.EventEmitter {
    redisClient;
    rpcBatchManager;
    metadataCacheTTL = 3600; // 1 hour in seconds
    constructor(rpcBatchManager) {
        super();
        this.redisClient = (0, redis_1.getRedisClient)();
        this.rpcBatchManager = rpcBatchManager;
    }
    async getTokenMetadata(tokenAddress, chainId) {
        const cacheKey = `metadata:${chainId}:${tokenAddress.toLowerCase()}`;
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const metadata = await this.fetchAlchemyMetadata(tokenAddress, chainId);
        if (!metadata) {
            const onChainMetadata = await this.fetchOnChainMetadata(tokenAddress, chainId);
            if (!onChainMetadata) {
                return null;
            }
            await this.redisClient.setex(cacheKey, this.metadataCacheTTL, JSON.stringify(onChainMetadata));
            return onChainMetadata;
        }
        await this.redisClient.setex(cacheKey, this.metadataCacheTTL, JSON.stringify(metadata));
        return metadata;
    }
    async fetchAlchemyMetadata(tokenAddress, chainId) {
        try {
            const apiKey = process.env.ALCHEMY_API_KEY;
            if (!apiKey) {
                return null;
            }
            const chainNameMap = {
                [chains_1.CHAIN_IDS.ETHEREUM]: 'eth-mainnet',
                [chains_1.CHAIN_IDS.ARBITRUM]: 'arb-mainnet',
                [chains_1.CHAIN_IDS.AVALANCHE]: 'avax-mainnet'
            };
            const chainName = chainNameMap[chainId];
            if (!chainName) {
                return null;
            }
            const url = `https://${chainName}.g.alchemy.com/v2/${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'alchemy_getTokenMetadata',
                    params: [tokenAddress]
                })
            });
            if (!response.ok) {
                throw new Error(`Alchemy API error: ${response.status}`);
            }
            const data = await response.json();
            if (!data.result) {
                return null;
            }
            const alchemyMetadata = data.result;
            return {
                name: alchemyMetadata.name || 'Unknown Token',
                symbol: alchemyMetadata.symbol || 'UNKNOWN',
                decimals: alchemyMetadata.decimals || 18,
                logoURI: alchemyMetadata.logo || undefined,
                chainId,
                address: tokenAddress.toLowerCase()
            };
        }
        catch (error) {
            this.emit('error', { method: 'fetchAlchemyMetadata', tokenAddress, chainId, error });
            return null;
        }
    }
    async fetchOnChainMetadata(tokenAddress, chainId) {
        try {
            const nameSelector = '0x06fdde03'; // name()
            const symbolSelector = '0x95d89b41'; // symbol()
            const decimalsSelector = '0x313ce567'; // decimals()
            const requests = [
                {
                    id: 1,
                    method: 'eth_call',
                    params: [{
                            to: tokenAddress,
                            data: nameSelector
                        }, 'latest']
                },
                {
                    id: 2,
                    method: 'eth_call',
                    params: [{
                            to: tokenAddress,
                            data: symbolSelector
                        }, 'latest']
                },
                {
                    id: 3,
                    method: 'eth_call',
                    params: [{
                            to: tokenAddress,
                            data: decimalsSelector
                        }, 'latest']
                }
            ];
            const response = await this.rpcBatchManager.batchCall({
                chainId,
                requests
            });
            const [nameResponse, symbolResponse, decimalsResponse] = response.responses;
            if (!nameResponse.result || !symbolResponse.result || !decimalsResponse.result) {
                return null;
            }
            const name = this.decodeString(nameResponse.result);
            const symbol = this.decodeString(symbolResponse.result);
            const decimals = parseInt(decimalsResponse.result, 16);
            if (!name || !symbol || isNaN(decimals)) {
                return null;
            }
            return {
                name,
                symbol,
                decimals,
                chainId,
                address: tokenAddress.toLowerCase()
            };
        }
        catch (error) {
            this.emit('error', { method: 'fetchOnChainMetadata', tokenAddress, chainId, error });
            return null;
        }
    }
    decodeString(hexString) {
        try {
            if (!hexString || hexString === '0x') {
                return null;
            }
            const hex = hexString.slice(2);
            if (hex.length < 128) {
                return null;
            }
            const lengthHex = hex.slice(64, 128);
            const length = parseInt(lengthHex, 16);
            if (length === 0 || length > 1000) {
                return null;
            }
            const dataHex = hex.slice(128, 128 + length * 2);
            let result = '';
            for (let i = 0; i < dataHex.length; i += 2) {
                const byte = parseInt(dataHex.substr(i, 2), 16);
                if (byte === 0)
                    break;
                result += String.fromCharCode(byte);
            }
            return result || null;
        }
        catch {
            return null;
        }
    }
    async getBatchTokenMetadata(tokens) {
        const metadataMap = new Map();
        const uncachedTokens = [];
        await Promise.all(tokens.map(async (token) => {
            const cacheKey = `metadata:${token.chainId}:${token.address.toLowerCase()}`;
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                const metadata = JSON.parse(cached);
                metadataMap.set(`${token.chainId}:${token.address.toLowerCase()}`, metadata);
            }
            else {
                uncachedTokens.push(token);
            }
        }));
        if (uncachedTokens.length === 0) {
            return metadataMap;
        }
        await Promise.all(uncachedTokens.map(async (token) => {
            const metadata = await this.getTokenMetadata(token.address, token.chainId);
            if (metadata) {
                metadataMap.set(`${token.chainId}:${token.address.toLowerCase()}`, metadata);
            }
        }));
        return metadataMap;
    }
    getNativeTokenMetadata(chainId) {
        const nativeTokens = {
            [chains_1.CHAIN_IDS.ETHEREUM]: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
                logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
                chainId: chains_1.CHAIN_IDS.ETHEREUM,
                address: '0x0000000000000000000000000000000000000000'
            },
            [chains_1.CHAIN_IDS.ARBITRUM]: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
                logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
                chainId: chains_1.CHAIN_IDS.ARBITRUM,
                address: '0x0000000000000000000000000000000000000000'
            },
            [chains_1.CHAIN_IDS.AVALANCHE]: {
                name: 'Avalanche',
                symbol: 'AVAX',
                decimals: 18,
                logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png',
                chainId: chains_1.CHAIN_IDS.AVALANCHE,
                address: '0x0000000000000000000000000000000000000000'
            }
        };
        return nativeTokens[chainId] || {
            name: 'Native Token',
            symbol: 'NATIVE',
            decimals: 18,
            chainId,
            address: '0x0000000000000000000000000000000000000000'
        };
    }
    async clearCache() {
        const keys = await this.redisClient.keys('metadata:*');
        if (keys.length > 0) {
            await this.redisClient.del(...keys);
        }
    }
}
exports.TokenMetadataService = TokenMetadataService;
//# sourceMappingURL=TokenMetadataService.js.map