"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBalanceService = void 0;
const chains_1 = require("../../../../packages/shared/src/constants/chains");
const portfolio_1 = require("../../../../packages/shared/src/types/portfolio");
const redis_1 = require("../db/redis");
const events_1 = require("events");
class TokenBalanceService extends events_1.EventEmitter {
    rpcBatchManager;
    redisClient;
    commonTokens;
    constructor(rpcBatchManager) {
        super();
        this.rpcBatchManager = rpcBatchManager;
        this.redisClient = (0, redis_1.getRedisClient)();
        this.commonTokens = this.initializeCommonTokens();
    }
    initializeCommonTokens() {
        const tokens = new Map();
        tokens.set(chains_1.CHAIN_IDS.ETHEREUM, [
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
            '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
            '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
            '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
            '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
            '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
            '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE
            '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', // MKR
            '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F', // SNX
            '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e', // YFI
            '0xD533a949740bb3306d119CC777fa900bA034cd52', // CRV
            '0xba100000625a3754423978a60c9317c58a424e3D', // BAL
            '0x4d224452801ACEd8B2F0aebE155379bb5D594381', // APE
            '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', // SHIB
        ]);
        tokens.set(chains_1.CHAIN_IDS.ARBITRUM, [
            '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC.e
            '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
            '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
            '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
            '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', // WBTC
            '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
            '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', // LINK
            '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', // UNI
            '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB
            '0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978', // CRV
            '0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8', // BAL
            '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', // GMX
        ]);
        tokens.set(chains_1.CHAIN_IDS.AVALANCHE, [
            '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
            '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDT
            '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', // DAI.e
            '0x50b7545627a5162F82A992c33b87aDc75187B218', // WBTC.e
            '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', // WETH.e
            '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
            '0x5947BB275c521040051D82396192181b413227A3', // LINK.e
            '0x8eBAf22B6F053dFFeaf46f4Dd9eFA95D89ba8580', // UNI.e
            '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', // JOE
            '0x2147EFFF675e4A4eE1C2f918d181cDBd7a8E208f', // ALPHA.e
            '0xd1c3f94DE7e5B45fa4eDBBA472491a9f4B166FC4', // XAVA
        ]);
        return tokens;
    }
    async detectTokenBalances(walletAddress, chainIds) {
        const results = await Promise.all(chainIds.map(chainId => this.detectChainTokens(walletAddress, chainId)));
        return results;
    }
    async detectChainTokens(walletAddress, chainId) {
        const cacheKey = `token-balances:${chainId}:${walletAddress}`;
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            return {
                ...parsed,
                nativeBalance: BigInt(parsed.nativeBalance),
                tokens: parsed.tokens.map((t) => ({
                    ...t,
                    balance: t.balance ? BigInt(t.balance) : undefined
                }))
            };
        }
        const nativeBalancePromise = this.getNativeBalance(walletAddress, chainId);
        // Prefer Alchemy token discovery when available; fallback to common token heuristics
        const alchemyTokens = await this.fetchAlchemyTokenBalances(walletAddress, chainId);
        const tokens = [];
        if (alchemyTokens.length > 0) {
            tokens.push(...alchemyTokens);
        }
        else {
            const commonTokenAddresses = this.commonTokens.get(chainId) || [];
            const tokenBalancePromises = commonTokenAddresses.map(tokenAddress => this.getTokenBalance(walletAddress, tokenAddress, chainId));
            const [nativeBalanceDrop, ...tokenBalances] = await Promise.all([
                nativeBalancePromise,
                ...tokenBalancePromises
            ]);
            // Ensure native balance await completes
            void nativeBalanceDrop;
            tokenBalances.forEach((balance, index) => {
                if (balance && balance > 0n) {
                    tokens.push({
                        address: commonTokenAddresses[index],
                        hasBalance: true,
                        balance
                    });
                }
            });
        }
        const nativeBalance = await nativeBalancePromise;
        const result = {
            chainId,
            walletAddress,
            nativeBalance,
            tokens
        };
        const cacheData = {
            ...result,
            nativeBalance: result.nativeBalance.toString(),
            tokens: result.tokens.map(t => ({
                ...t,
                balance: t.balance?.toString()
            }))
        };
        // ioredis method name is lowercase setex in some environments
        // @ts-ignore
        if (typeof this.redisClient.setEx === 'function') {
            // @ts-ignore
            await this.redisClient.setEx(cacheKey, 15, JSON.stringify(cacheData));
        }
        else {
            await this.redisClient.setex(cacheKey, 15, JSON.stringify(cacheData));
        }
        return result;
    }
    async getNativeBalance(walletAddress, chainId) {
        try {
            const response = await this.rpcBatchManager.batchCall({
                chainId,
                requests: [{
                        id: 1,
                        method: 'eth_getBalance',
                        params: [walletAddress, 'latest']
                    }]
            });
            if (response?.responses?.[0]?.result) {
                return BigInt(response.responses[0].result);
            }
            return 0n;
        }
        catch (error) {
            if (this.listenerCount('error') > 0) {
                this.emit('error', { method: 'getNativeBalance', chainId, error });
            }
            else {
                this.emit('serviceError', { method: 'getNativeBalance', chainId, error });
            }
            return 0n;
        }
    }
    async getTokenBalance(walletAddress, tokenAddress, chainId) {
        try {
            const balanceOfSelector = '0x70a08231';
            const data = balanceOfSelector + walletAddress.slice(2).padStart(64, '0');
            const response = await this.rpcBatchManager.batchCall({
                chainId,
                requests: [{
                        id: 1,
                        method: 'eth_call',
                        params: [{
                                to: tokenAddress,
                                data: data
                            }, 'latest']
                    }]
            });
            if (response?.responses?.[0]?.result && response.responses[0].result !== '0x') {
                return BigInt(response.responses[0].result);
            }
            return null;
        }
        catch (error) {
            if (this.listenerCount('error') > 0) {
                this.emit('error', { method: 'getTokenBalance', chainId, tokenAddress, error });
            }
            else {
                this.emit('serviceError', { method: 'getTokenBalance', chainId, tokenAddress, error });
            }
            return null;
        }
    }
    async fetchAlchemyTokenBalances(walletAddress, chainId) {
        try {
            const alchemyApiKey = process.env.ALCHEMY_API_KEY;
            // In tests, allow mocked fetch even without a real API key
            if (!alchemyApiKey && process.env.NODE_ENV !== 'test') {
                return [];
            }
            const chainNameMap = {
                [chains_1.CHAIN_IDS.ETHEREUM]: 'eth-mainnet',
                [chains_1.CHAIN_IDS.ARBITRUM]: 'arb-mainnet',
                [chains_1.CHAIN_IDS.AVALANCHE]: 'avax-mainnet'
            };
            const chainName = chainNameMap[chainId];
            if (!chainName) {
                return [];
            }
            const url = `https://${chainName}.g.alchemy.com/v2/${alchemyApiKey ?? 'test'}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'alchemy_getTokenBalances',
                    params: [walletAddress]
                })
            });
            if (!response.ok) {
                throw new Error(`Alchemy API error: ${response.status}`);
            }
            const data = await response.json();
            if (!data.result?.tokenBalances) {
                return [];
            }
            return data.result.tokenBalances
                .filter((tb) => tb.tokenBalance && tb.tokenBalance !== '0x0')
                .map((tb) => ({
                address: tb.contractAddress,
                hasBalance: true,
                balance: BigInt(tb.tokenBalance)
            }));
        }
        catch (error) {
            if (this.listenerCount('error') > 0) {
                this.emit('error', { method: 'fetchAlchemyTokenBalances', chainId, error });
            }
            else {
                this.emit('serviceError', { method: 'fetchAlchemyTokenBalances', chainId, error });
            }
            return [];
        }
    }
    async batchFetchTokenBalances(walletAddress, tokenAddresses, chainId) {
        const balances = new Map();
        if (tokenAddresses.length === 0) {
            return balances;
        }
        const batchSize = 50;
        const batches = [];
        for (let i = 0; i < tokenAddresses.length; i += batchSize) {
            batches.push(tokenAddresses.slice(i, i + batchSize));
        }
        await Promise.all(batches.map(async (batch) => {
            const balanceOfSelector = '0x70a08231';
            const requests = batch.map((tokenAddress, index) => ({
                id: index,
                method: 'eth_call',
                params: [{
                        to: tokenAddress,
                        data: balanceOfSelector + walletAddress.slice(2).padStart(64, '0')
                    }, 'latest']
            }));
            try {
                const response = await this.rpcBatchManager.batchCall({
                    chainId,
                    requests
                });
                response.responses.forEach((res, index) => {
                    if (res.result && res.result !== '0x') {
                        const tokenAddress = batch[index];
                        balances.set(tokenAddress.toLowerCase(), BigInt(res.result));
                    }
                });
            }
            catch (error) {
                if (this.listenerCount('error') > 0) {
                    this.emit('error', { method: 'batchFetchTokenBalances', chainId, error });
                }
                else {
                    this.emit('serviceError', { method: 'batchFetchTokenBalances', chainId, error });
                }
            }
        }));
        return balances;
    }
    categorizeToken(metadata) {
        const symbol = metadata.symbol.toUpperCase();
        const name = metadata.name.toLowerCase();
        const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'USDP', 'GUSD'];
        if (stablecoins.includes(symbol)) {
            return portfolio_1.AssetCategory.STABLECOIN;
        }
        const bluechips = ['BTC', 'WBTC', 'ETH', 'WETH', 'AVAX'];
        if (bluechips.some(bc => symbol.includes(bc))) {
            return portfolio_1.AssetCategory.BLUECHIP;
        }
        const defiTokens = ['UNI', 'AAVE', 'COMP', 'MKR', 'SNX', 'YFI', 'CRV', 'BAL', 'SUSHI', 'GMX', 'JOE'];
        if (defiTokens.includes(symbol)) {
            return portfolio_1.AssetCategory.DEFI;
        }
        const liquidStaking = ['STETH', 'RETH', 'CBETH', 'WSTETH', 'SFRXETH'];
        if (liquidStaking.some(ls => symbol.includes(ls))) {
            return portfolio_1.AssetCategory.LIQUID_STAKING;
        }
        const memeTokens = ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONE'];
        if (memeTokens.includes(symbol) || name.includes('inu') || name.includes('moon')) {
            return portfolio_1.AssetCategory.MEME;
        }
        if (name.includes('nft') || symbol.includes('NFT')) {
            return portfolio_1.AssetCategory.NFT;
        }
        return portfolio_1.AssetCategory.OTHER;
    }
    async getFormattedBalances(walletAddress, chainIds) {
        const chainBalances = await this.detectTokenBalances(walletAddress, chainIds);
        const totalTokensFound = chainBalances.reduce((sum, chain) => sum + chain.tokens.filter(t => t.hasBalance).length, 0);
        const hasNativeBalance = chainBalances.some(chain => chain.nativeBalance > 0n);
        const hasTokenBalance = totalTokensFound > 0;
        return {
            chains: chainBalances,
            totalTokensFound,
            hasBalances: hasNativeBalance || hasTokenBalance
        };
    }
}
exports.TokenBalanceService = TokenBalanceService;
//# sourceMappingURL=TokenBalanceService.js.map