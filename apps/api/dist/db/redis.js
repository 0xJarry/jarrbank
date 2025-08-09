"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
exports.getRedisClient = getRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
class RedisCache {
    client;
    config;
    isConnected = false;
    constructor(config) {
        this.config = config;
        this.client = new ioredis_1.default(config.redisUrl, {
            password: config.password,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            }
        });
        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('Redis connected successfully');
        });
        this.client.on('error', (err) => {
            console.error('Redis connection error:', err);
            this.isConnected = false;
        });
        this.client.on('close', () => {
            this.isConnected = false;
            console.log('Redis connection closed');
        });
    }
    generateCacheKey(type, chainId, ...parts) {
        const keyParts = ['jarrbank', type];
        if (chainId !== undefined) {
            keyParts.push(`chain:${chainId}`);
        }
        keyParts.push(...parts.map(p => String(p)));
        return keyParts.join(':');
    }
    async getCachedData(key) {
        if (!this.isConnected) {
            return null;
        }
        try {
            const cached = await this.client.get(key);
            if (!cached) {
                return null;
            }
            const parsedData = JSON.parse(cached);
            const age = Date.now() - parsedData.timestamp;
            if (age > parsedData.ttl * 1000) {
                await this.client.del(key);
                return null;
            }
            return parsedData;
        }
        catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    }
    async setCachedData(key, data, ttlSeconds, chainId) {
        if (!this.isConnected) {
            return;
        }
        try {
            const ttl = ttlSeconds || this.config.ttl.rpcResponse;
            const cachedData = {
                data,
                timestamp: Date.now(),
                ttl,
                chainId
            };
            await this.client.setex(key, ttl, JSON.stringify(cachedData));
        }
        catch (error) {
            console.error('Error setting cached data:', error);
        }
    }
    async getCachedBalance(chainId, address) {
        const key = this.generateCacheKey('balance', chainId, address.toLowerCase());
        const cached = await this.getCachedData(key);
        if (cached) {
            return BigInt(cached.data);
        }
        return null;
    }
    async setCachedBalance(chainId, address, balance) {
        const key = this.generateCacheKey('balance', chainId, address.toLowerCase());
        await this.setCachedData(key, balance.toString(), this.config.ttl.balance, chainId);
    }
    async getCachedTokenBalance(chainId, tokenAddress, walletAddress) {
        const key = this.generateCacheKey('tokenBalance', chainId, tokenAddress.toLowerCase(), walletAddress.toLowerCase());
        const cached = await this.getCachedData(key);
        if (cached) {
            return BigInt(cached.data);
        }
        return null;
    }
    async setCachedTokenBalance(chainId, tokenAddress, walletAddress, balance) {
        const key = this.generateCacheKey('tokenBalance', chainId, tokenAddress.toLowerCase(), walletAddress.toLowerCase());
        await this.setCachedData(key, balance.toString(), this.config.ttl.tokenBalance, chainId);
    }
    async getCachedBlockNumber(chainId) {
        const key = this.generateCacheKey('blockNumber', chainId);
        const cached = await this.getCachedData(key);
        if (cached) {
            return BigInt(cached.data);
        }
        return null;
    }
    async setCachedBlockNumber(chainId, blockNumber) {
        const key = this.generateCacheKey('blockNumber', chainId);
        await this.setCachedData(key, blockNumber.toString(), this.config.ttl.blockNumber, chainId);
    }
    async getCachedMetadata(chainId, tokenAddress) {
        const key = this.generateCacheKey('metadata', chainId, tokenAddress.toLowerCase());
        const cached = await this.getCachedData(key);
        return cached?.data || null;
    }
    async setCachedMetadata(chainId, tokenAddress, metadata) {
        const key = this.generateCacheKey('metadata', chainId, tokenAddress.toLowerCase());
        await this.setCachedData(key, metadata, this.config.ttl.metadata, chainId);
    }
    async invalidateCache(pattern) {
        if (!this.isConnected) {
            return;
        }
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        }
        catch (error) {
            console.error('Error invalidating cache:', error);
        }
    }
    async invalidateBalanceCache(chainId, address) {
        let pattern = 'jarrbank:balance:';
        if (chainId !== undefined) {
            pattern += `chain:${chainId}:`;
        }
        else {
            pattern += '*';
        }
        if (address) {
            pattern += address.toLowerCase();
        }
        else {
            pattern += '*';
        }
        await this.invalidateCache(pattern);
    }
    async flushAll() {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.flushall();
        }
        catch (error) {
            console.error('Error flushing cache:', error);
        }
    }
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
    async disconnect() {
        await this.client.quit();
    }
    getCacheStats() {
        return {
            connected: this.isConnected,
            ttlConfig: this.config.ttl
        };
    }
}
exports.RedisCache = RedisCache;
// Global Redis client instance
let globalRedisClient = null;
function getRedisClient() {
    if (!globalRedisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        globalRedisClient = new ioredis_1.default(redisUrl, {
            retryStrategy: (times) => Math.min(times * 50, 2000)
        });
    }
    return globalRedisClient;
}
//# sourceMappingURL=redis.js.map