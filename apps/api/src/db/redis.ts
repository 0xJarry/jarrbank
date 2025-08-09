import Redis from 'ioredis';
import { ChainId } from '../../../../packages/shared/src/constants/chains';

export interface CacheConfig {
  redisUrl: string;
  password?: string;
  ttl: {
    balance: number;      // 30 seconds for balance data
    metadata: number;     // 1 hour for token metadata
    blockNumber: number;  // 10 seconds for block numbers
    tokenBalance: number; // 30 seconds for token balances
    rpcResponse: number;  // 60 seconds for generic RPC responses
  };
}

export interface CachedData<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  chainId?: ChainId;
}

export class RedisCache {
  private client: Redis;
  private config: CacheConfig;
  private isConnected: boolean = false;

  constructor(config: CacheConfig) {
    this.config = config;
    
    this.client = new Redis(config.redisUrl, {
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

  private generateCacheKey(
    type: string,
    chainId?: ChainId,
    ...parts: (string | number)[]
  ): string {
    const keyParts = ['jarrbank', type];
    
    if (chainId !== undefined) {
      keyParts.push(`chain:${chainId}`);
    }
    
    keyParts.push(...parts.map(p => String(p)));
    
    return keyParts.join(':');
  }

  async getCachedData<T>(key: string): Promise<CachedData<T> | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const cached = await this.client.get(key);
      
      if (!cached) {
        return null;
      }

      const parsedData = JSON.parse(cached) as CachedData<T>;
      
      const age = Date.now() - parsedData.timestamp;
      if (age > parsedData.ttl * 1000) {
        await this.client.del(key);
        return null;
      }

      return parsedData;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async setCachedData<T>(
    key: string,
    data: T,
    ttlSeconds?: number,
    chainId?: ChainId
  ): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const ttl = ttlSeconds || this.config.ttl.rpcResponse;
      
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        chainId
      };

      await this.client.setex(
        key,
        ttl,
        JSON.stringify(cachedData)
      );
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }

  async getCachedBalance(
    chainId: ChainId,
    address: string
  ): Promise<bigint | null> {
    const key = this.generateCacheKey('balance', chainId, address.toLowerCase());
    const cached = await this.getCachedData<string>(key);
    
    if (cached) {
      return BigInt(cached.data);
    }
    
    return null;
  }

  async setCachedBalance(
    chainId: ChainId,
    address: string,
    balance: bigint
  ): Promise<void> {
    const key = this.generateCacheKey('balance', chainId, address.toLowerCase());
    await this.setCachedData(
      key,
      balance.toString(),
      this.config.ttl.balance,
      chainId
    );
  }

  async getCachedTokenBalance(
    chainId: ChainId,
    tokenAddress: string,
    walletAddress: string
  ): Promise<bigint | null> {
    const key = this.generateCacheKey(
      'tokenBalance',
      chainId,
      tokenAddress.toLowerCase(),
      walletAddress.toLowerCase()
    );
    const cached = await this.getCachedData<string>(key);
    
    if (cached) {
      return BigInt(cached.data);
    }
    
    return null;
  }

  async setCachedTokenBalance(
    chainId: ChainId,
    tokenAddress: string,
    walletAddress: string,
    balance: bigint
  ): Promise<void> {
    const key = this.generateCacheKey(
      'tokenBalance',
      chainId,
      tokenAddress.toLowerCase(),
      walletAddress.toLowerCase()
    );
    await this.setCachedData(
      key,
      balance.toString(),
      this.config.ttl.tokenBalance,
      chainId
    );
  }

  async getCachedBlockNumber(chainId: ChainId): Promise<bigint | null> {
    const key = this.generateCacheKey('blockNumber', chainId);
    const cached = await this.getCachedData<string>(key);
    
    if (cached) {
      return BigInt(cached.data);
    }
    
    return null;
  }

  async setCachedBlockNumber(
    chainId: ChainId,
    blockNumber: bigint
  ): Promise<void> {
    const key = this.generateCacheKey('blockNumber', chainId);
    await this.setCachedData(
      key,
      blockNumber.toString(),
      this.config.ttl.blockNumber,
      chainId
    );
  }

  async getCachedMetadata(
    chainId: ChainId,
    tokenAddress: string
  ): Promise<any | null> {
    const key = this.generateCacheKey('metadata', chainId, tokenAddress.toLowerCase());
    const cached = await this.getCachedData(key);
    
    return cached?.data || null;
  }

  async setCachedMetadata(
    chainId: ChainId,
    tokenAddress: string,
    metadata: any
  ): Promise<void> {
    const key = this.generateCacheKey('metadata', chainId, tokenAddress.toLowerCase());
    await this.setCachedData(
      key,
      metadata,
      this.config.ttl.metadata,
      chainId
    );
  }

  async invalidateCache(pattern: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  async invalidateBalanceCache(chainId?: ChainId, address?: string): Promise<void> {
    let pattern = 'jarrbank:balance:';
    
    if (chainId !== undefined) {
      pattern += `chain:${chainId}:`;
    } else {
      pattern += '*';
    }
    
    if (address) {
      pattern += address.toLowerCase();
    } else {
      pattern += '*';
    }
    
    await this.invalidateCache(pattern);
  }

  async flushAll(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.flushall();
    } catch (error) {
      console.error('Error flushing cache:', error);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  getCacheStats(): {
    connected: boolean;
    ttlConfig: CacheConfig['ttl'];
  } {
    return {
      connected: this.isConnected,
      ttlConfig: this.config.ttl
    };
  }
}

// Global Redis client instance
let globalRedisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!globalRedisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    globalRedisClient = new Redis(redisUrl, {
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
  }
  return globalRedisClient;
}