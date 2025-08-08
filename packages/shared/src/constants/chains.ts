export const CHAIN_IDS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  AVALANCHE: 43114
} as const;

export type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS];

export interface Chain {
  id: ChainId;
  name: string;
  shortName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  rpcUrl?: string;
}

export const CHAINS: Record<ChainId, Chain> = {
  [CHAIN_IDS.ETHEREUM]: {
    id: CHAIN_IDS.ETHEREUM,
    name: 'Ethereum',
    shortName: 'ETH',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://etherscan.io'
  },
  [CHAIN_IDS.ARBITRUM]: {
    id: CHAIN_IDS.ARBITRUM,
    name: 'Arbitrum One',
    shortName: 'ARB',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://arbiscan.io'
  },
  [CHAIN_IDS.AVALANCHE]: {
    id: CHAIN_IDS.AVALANCHE,
    name: 'Avalanche C-Chain',
    shortName: 'AVAX',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    blockExplorer: 'https://snowtrace.io'
  }
};

export function getChainById(chainId: ChainId): Chain | undefined {
  return CHAINS[chainId];
}

export function getAllChains(): Chain[] {
  return Object.values(CHAINS);
}