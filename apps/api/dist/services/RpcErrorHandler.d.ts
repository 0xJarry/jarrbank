import { ChainId } from '../../../../packages/shared/src/constants/chains';
export declare enum RpcErrorType {
    NETWORK_ERROR = "network_error",
    RATE_LIMIT = "rate_limit",
    INVALID_REQUEST = "invalid_request",
    INSUFFICIENT_FUNDS = "insufficient_funds",
    EXECUTION_REVERTED = "execution_reverted",
    BLOCK_NOT_FOUND = "block_not_found",
    TRANSACTION_FAILED = "transaction_failed",
    PROVIDER_ERROR = "provider_error",
    TIMEOUT = "timeout",
    UNKNOWN = "unknown"
}
export declare enum RecoveryAction {
    RETRY = "retry",
    FAILOVER = "failover",
    CACHE_FALLBACK = "cache_fallback",
    SKIP = "skip",
    ABORT = "abort"
}
export interface RpcError {
    type: RpcErrorType;
    code?: number;
    message: string;
    chainId?: ChainId;
    provider?: string;
    recoveryAction: RecoveryAction;
    retryable: boolean;
    originalError?: any;
}
export interface ErrorPattern {
    pattern: RegExp | string;
    type: RpcErrorType;
    recoveryAction: RecoveryAction;
    retryable: boolean;
}
export declare class RpcErrorClassifier {
    private static readonly ERROR_PATTERNS;
    static classify(error: any, chainId?: ChainId, provider?: string): RpcError;
    private static extractErrorMessage;
    private static extractErrorCode;
}
export interface ChainSpecificConfig {
    maxRetries: number;
    baseDelayMs: number;
    specificErrors: {
        [errorType: string]: RecoveryAction;
    };
}
export declare class ChainSpecificErrorHandler {
    private readonly chainConfigs;
    constructor();
    private initializeChainConfigs;
    getRecoveryAction(error: RpcError): RecoveryAction;
    getMaxRetries(chainId: ChainId): number;
    getBaseDelay(chainId: ChainId): number;
    shouldFailover(error: RpcError): boolean;
    shouldRetry(error: RpcError, attemptCount: number): boolean;
    updateChainConfig(chainId: ChainId, config: Partial<ChainSpecificConfig>): void;
}
export interface ErrorMetrics {
    totalErrors: number;
    errorsByType: Record<RpcErrorType, number>;
    errorsByChain: Record<ChainId, number>;
    errorsByProvider: Record<string, number>;
    failoverCount: number;
    retryCount: number;
}
export declare class ErrorMetricsCollector {
    private metrics;
    recordError(error: RpcError): void;
    recordFailover(): void;
    recordRetry(): void;
    getMetrics(): ErrorMetrics;
    reset(): void;
}
