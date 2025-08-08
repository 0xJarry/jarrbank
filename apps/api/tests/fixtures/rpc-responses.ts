import { RpcRequest, RpcResponse } from '../../src/services/RpcBatchManager';
import { CHAIN_IDS } from '../../../../packages/shared/src/constants/chains';

export const mockRpcRequests: RpcRequest[] = [
  {
    id: 1,
    method: 'eth_getBalance',
    params: ['0x742d35Cc6634C0532925a3b8D6Ac6c22af9abcde', 'latest']
  },
  {
    id: 2,
    method: 'eth_getBalance', 
    params: ['0x8ba1f109551bD432803012645Hac136c22af9abcde', 'latest']
  },
  {
    id: 3,
    method: 'eth_blockNumber',
    params: []
  }
];

export const mockRpcResponses: RpcResponse[] = [
  {
    id: 1,
    result: '0x1bc16d674ec80000' // 2 ETH in wei
  },
  {
    id: 2,
    result: '0x56bc75e2d631000' // 0.1 ETH in wei
  },
  {
    id: 3,
    result: '0x1234567' // Block number: 19234567
  }
];

export const mockErrorResponse: RpcResponse = {
  id: 1,
  error: {
    code: -32602,
    message: 'Invalid params'
  }
};

export const mockBalanceData = {
  [CHAIN_IDS.ETHEREUM]: {
    '0x742d35Cc6634C0532925a3b8D6Ac6c22af9abcde': BigInt('2000000000000000000'),
    '0x8ba1f109551bD432803012645Hac136c22af9abcde': BigInt('100000000000000000')
  },
  [CHAIN_IDS.ARBITRUM]: {
    '0x742d35Cc6634C0532925a3b8D6Ac6c22af9abcde': BigInt('1500000000000000000'),
    '0x8ba1f109551bD432803012645Hac136c22af9abcde': BigInt('250000000000000000')
  }
};

export const mockTokenBalanceData = {
  tokenAddress: '0xA0b86a33E6A8A4CC60BB7eA5E2ca4aA6cC11b8d8',
  balances: {
    '0x742d35Cc6634C0532925a3b8D6Ac6c22af9abcde': BigInt('1000000000000000000000'), // 1000 tokens
    '0x8ba1f109551bD432803012645Hac136c22af9abcde': BigInt('500000000000000000000')   // 500 tokens
  }
};

export const mockBlockNumbers = {
  [CHAIN_IDS.ETHEREUM]: BigInt('19234567'),
  [CHAIN_IDS.ARBITRUM]: BigInt('165789012'),
  [CHAIN_IDS.AVALANCHE]: BigInt('42156789')
};

export const mockAlchemyResponse = {
  jsonrpc: '2.0',
  id: 1,
  result: '0x1bc16d674ec80000'
};

export const mockInfuraResponse = {
  jsonrpc: '2.0', 
  id: 1,
  result: '0x1bc16d674ec80000'
};

export const mockRateLimitError = {
  message: 'Rate limit exceeded',
  status: 429
};

export const mockNetworkError = {
  message: 'Network error: timeout',
  code: 'NETWORK_ERROR'
};

export const mockServerError = {
  message: 'Internal server error',
  status: 503
};

// Mock provider configurations for testing
export const mockProviderConfig = {
  alchemy: {
    ethRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test-key',
    arbRpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/test-key',
    avaxRpcUrl: 'https://avax-mainnet.g.alchemy.com/v2/test-key'
  },
  infura: {
    projectId: 'test-project-id',
    projectSecret: 'test-secret'
  },
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000
  }
};

export const mockCacheConfig = {
  redisUrl: 'redis://localhost:6379',
  ttl: {
    balance: 30,
    metadata: 3600,
    blockNumber: 10,
    tokenBalance: 30,
    rpcResponse: 60
  }
};