import { ChainId } from '../../../../packages/shared/src/constants/chains';
import { TokenPriceData } from '../../../../packages/shared/src/types/portfolio';
import { EventEmitter } from 'events';
export declare class PriceService extends EventEmitter {
    private redisClient;
    private providers;
    private priceCacheTTL;
    constructor();
    private createMoralisProvider;
    private createDefiLlamaProvider;
    private createCoinMarketCapProvider;
    getTokenPrice(tokenAddress: string, chainId: ChainId, skipCache?: boolean): Promise<TokenPriceData | null>;
    getBatchTokenPrices(tokens: {
        address: string;
        chainId: ChainId;
    }[]): Promise<Map<string, TokenPriceData>>;
    getNativeTokenPrices(): Promise<Map<ChainId, number>>;
    clearCache(): Promise<void>;
}
