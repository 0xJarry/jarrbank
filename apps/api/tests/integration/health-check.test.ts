import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { createServer } from '../../src/server';
import { FastifyInstance } from 'fastify';
import { CHAIN_IDS } from '../../../../packages/shared/src/constants/chains';

// Mock environment variables
process.env.ALCHEMY_ETH_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/test-key';
process.env.ALCHEMY_ARB_RPC_URL = 'https://arb-mainnet.g.alchemy.com/v2/test-key'; 
process.env.ALCHEMY_AVAX_RPC_URL = 'https://avax-mainnet.g.alchemy.com/v2/test-key';
process.env.INFURA_PROJECT_ID = 'test-project-id';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock Redis
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    keys: vi.fn().mockResolvedValue([]),
    flushall: vi.fn().mockResolvedValue('OK'),
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK')
  }))
}));

// Mock fetch
global.fetch = vi.fn();

describe('Health Check Endpoint', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer();
    await server.ready();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return healthy status when all services are operational', async () => {
    // Mock successful RPC responses for all chains
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('eth-mainnet')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, result: '0x1234567' }])
        });
      } else if (url.includes('arb-mainnet')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, result: '0x9e0e484' }])
        });
      } else if (url.includes('avax-mainnet')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, result: '0x283d9e4' }])
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.status).toBe('healthy');
    expect(body.services.redis.status).toBe('healthy');
    expect(body.services.rpc.status).toBe('healthy');
    
    // Check all chains are tested
    expect(body.services.rpc.chains[CHAIN_IDS.ETHEREUM]).toBeDefined();
    expect(body.services.rpc.chains[CHAIN_IDS.ARBITRUM]).toBeDefined();
    expect(body.services.rpc.chains[CHAIN_IDS.AVALANCHE]).toBeDefined();
    
    expect(body.services.rpc.chains[CHAIN_IDS.ETHEREUM].healthy).toBe(true);
    expect(body.services.rpc.chains[CHAIN_IDS.ARBITRUM].healthy).toBe(true);
    expect(body.services.rpc.chains[CHAIN_IDS.AVALANCHE].healthy).toBe(true);
  });

  it('should return degraded status when some RPC providers fail', async () => {
    // Mock mixed responses - Ethereum fails, others succeed
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('eth-mainnet')) {
        return Promise.reject(new Error('Network timeout'));
      } else if (url.includes('arb-mainnet')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, result: '0x9e0e484' }])
        });
      } else if (url.includes('avax-mainnet')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, result: '0x283d9e4' }])
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(503);
    
    const body = JSON.parse(response.body);
    expect(body.status).toBe('degraded');
    expect(body.services.rpc.status).toBe('degraded');
    
    expect(body.services.rpc.chains[CHAIN_IDS.ETHEREUM].healthy).toBe(false);
    expect(body.services.rpc.chains[CHAIN_IDS.ARBITRUM].healthy).toBe(true);
    expect(body.services.rpc.chains[CHAIN_IDS.AVALANCHE].healthy).toBe(true);
    
    expect(body.services.rpc.chains[CHAIN_IDS.ETHEREUM].error).toBe('Network timeout');
  });

  it('should include response time and uptime metrics', async () => {
    // Mock successful responses
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, result: '0x123' }])
    });

    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    const body = JSON.parse(response.body);
    
    expect(body.responseTime).toBeGreaterThan(0);
    expect(body.uptime).toBeGreaterThan(0);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should include queue and error metrics', async () => {
    // Mock successful responses
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, result: '0x123' }])
    });

    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    const body = JSON.parse(response.body);
    
    expect(body.metrics.queue).toBeDefined();
    expect(body.metrics.errors).toBeDefined();
    
    expect(typeof body.metrics.queue.totalQueued).toBe('number');
    expect(typeof body.metrics.queue.totalActive).toBe('number');
    expect(typeof body.metrics.errors.totalErrors).toBe('number');
  });

  it('should handle Redis connection failures gracefully', async () => {
    // Mock Redis ping failure
    const mockRedisInstance = {
      on: vi.fn(),
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      keys: vi.fn().mockResolvedValue([]),
      flushall: vi.fn().mockResolvedValue('OK'),
      ping: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
      quit: vi.fn().mockResolvedValue('OK')
    };

    // Mock successful RPC responses
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, result: '0x123' }])
    });

    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(503);
    
    const body = JSON.parse(response.body);
    expect(body.status).toBe('degraded');
    expect(body.services.redis.status).toBe('unhealthy');
  });

  it('should handle complete service failure', async () => {
    // Mock all services failing
    (fetch as any).mockRejectedValue(new Error('All networks down'));

    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(503);
    
    const body = JSON.parse(response.body);
    expect(body.status).toBe('degraded');
    expect(body.services.rpc.status).toBe('degraded');
    
    // All chains should be unhealthy
    Object.values(body.services.rpc.chains).forEach((chain: any) => {
      expect(chain.healthy).toBe(false);
      expect(chain.error).toBeDefined();
    });
  });

  it('should measure and report individual chain response times', async () => {
    // Mock responses with different delays
    (fetch as any).mockImplementation((url: string) => {
      const delay = url.includes('eth-mainnet') ? 100 : 50;
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1, result: '0x123' }])
          });
        }, delay);
      });
    });

    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    const body = JSON.parse(response.body);
    
    // Ethereum should have higher response time due to 100ms delay
    expect(body.services.rpc.chains[CHAIN_IDS.ETHEREUM].responseTime).toBeGreaterThan(90);
    expect(body.services.rpc.chains[CHAIN_IDS.ARBITRUM].responseTime).toBeGreaterThan(40);
    expect(body.services.rpc.chains[CHAIN_IDS.AVALANCHE].responseTime).toBeGreaterThan(40);
  });
});