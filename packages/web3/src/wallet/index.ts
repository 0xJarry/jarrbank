// Placeholder for wallet utilities
export interface WalletConnection {
  address: string;
  chainId: number;
  connected: boolean;
}

export enum WalletType {
  METAMASK = 'metamask',
  WALLETCONNECT = 'walletconnect',
  COINBASE = 'coinbase',
  RABBY = 'rabby',
}