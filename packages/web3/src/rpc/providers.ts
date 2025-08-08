import { Chain } from '../../../shared/src/constants/chains';

export interface RpcProvider {
  name: string;
  url: string;
  priority: number;
  chainId: number;
  headers?: Record<string, string>;
}

export interface RpcConfig {
  alchemy: {
    ethRpcUrl: string;
    arbRpcUrl: string;
    avaxRpcUrl: string;
  };
  infura: {
    projectId: string;
    projectSecret?: string;
  };
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

export class RpcProviderManager {
  private config: RpcConfig;
  private providers: Map<number, RpcProvider[]> = new Map();

  constructor(config: RpcConfig) {
    this.config = config;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Ethereum Mainnet (Chain ID: 1)
    this.providers.set(1, [
      {
        name: 'Alchemy-ETH',
        url: this.config.alchemy.ethRpcUrl,
        priority: 1,
        chainId: 1
      },
      {
        name: 'Infura-ETH',
        url: `https://mainnet.infura.io/v3/${this.config.infura.projectId}`,
        priority: 2,
        chainId: 1,
        headers: this.config.infura.projectSecret ? {
          'Authorization': `Basic ${Buffer.from(`:${this.config.infura.projectSecret}`).toString('base64')}`
        } : undefined
      }
    ]);

    // Arbitrum One (Chain ID: 42161)
    this.providers.set(42161, [
      {
        name: 'Alchemy-ARB',
        url: this.config.alchemy.arbRpcUrl,
        priority: 1,
        chainId: 42161
      },
      {
        name: 'Infura-ARB',
        url: `https://arbitrum-mainnet.infura.io/v3/${this.config.infura.projectId}`,
        priority: 2,
        chainId: 42161,
        headers: this.config.infura.projectSecret ? {
          'Authorization': `Basic ${Buffer.from(`:${this.config.infura.projectSecret}`).toString('base64')}`
        } : undefined
      }
    ]);

    // Avalanche C-Chain (Chain ID: 43114)
    this.providers.set(43114, [
      {
        name: 'Alchemy-AVAX',
        url: this.config.alchemy.avaxRpcUrl,
        priority: 1,
        chainId: 43114
      },
      {
        name: 'Infura-AVAX',
        url: `https://avalanche-mainnet.infura.io/v3/${this.config.infura.projectId}`,
        priority: 2,
        chainId: 43114,
        headers: this.config.infura.projectSecret ? {
          'Authorization': `Basic ${Buffer.from(`:${this.config.infura.projectSecret}`).toString('base64')}`
        } : undefined
      }
    ]);
  }

  getProviders(chainId: number): RpcProvider[] {
    const providers = this.providers.get(chainId);
    if (!providers) {
      throw new Error(`No RPC providers configured for chain ${chainId}`);
    }
    return [...providers].sort((a, b) => a.priority - b.priority);
  }

  getPrimaryProvider(chainId: number): RpcProvider {
    const providers = this.getProviders(chainId);
    return providers[0];
  }

  getFallbackProvider(chainId: number): RpcProvider | undefined {
    const providers = this.getProviders(chainId);
    return providers[1];
  }

  getAllChainIds(): number[] {
    return Array.from(this.providers.keys());
  }

  rotateProvider(chainId: number): RpcProvider | undefined {
    const providers = this.providers.get(chainId);
    if (!providers || providers.length <= 1) {
      return undefined;
    }

    // Move primary to end and return new primary
    const [primary, ...rest] = providers;
    this.providers.set(chainId, [...rest, { ...primary, priority: rest.length + 1 }]);
    
    // Renumber priorities
    const updatedProviders = this.providers.get(chainId)!;
    updatedProviders.forEach((provider, index) => {
      provider.priority = index + 1;
    });

    return updatedProviders[0];
  }
}