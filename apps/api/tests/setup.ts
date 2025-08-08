import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ALCHEMY_ETH_RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/test-key';
process.env.ALCHEMY_ARB_RPC_URL = 'https://arb-mainnet.g.alchemy.com/v2/test-key';
process.env.ALCHEMY_AVAX_RPC_URL = 'https://avax-mainnet.g.alchemy.com/v2/test-key';
process.env.INFURA_PROJECT_ID = 'test-project-id';
process.env.INFURA_PROJECT_SECRET = 'test-secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RPC_RATE_LIMIT_MAX = '100';
process.env.RPC_RATE_LIMIT_WINDOW = '60000';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};