"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMetricsCollector = exports.ChainSpecificErrorHandler = exports.RpcErrorClassifier = exports.RecoveryAction = exports.RpcErrorType = void 0;
var RpcErrorType;
(function (RpcErrorType) {
    RpcErrorType["NETWORK_ERROR"] = "network_error";
    RpcErrorType["RATE_LIMIT"] = "rate_limit";
    RpcErrorType["INVALID_REQUEST"] = "invalid_request";
    RpcErrorType["INSUFFICIENT_FUNDS"] = "insufficient_funds";
    RpcErrorType["EXECUTION_REVERTED"] = "execution_reverted";
    RpcErrorType["BLOCK_NOT_FOUND"] = "block_not_found";
    RpcErrorType["TRANSACTION_FAILED"] = "transaction_failed";
    RpcErrorType["PROVIDER_ERROR"] = "provider_error";
    RpcErrorType["TIMEOUT"] = "timeout";
    RpcErrorType["UNKNOWN"] = "unknown";
})(RpcErrorType || (exports.RpcErrorType = RpcErrorType = {}));
var RecoveryAction;
(function (RecoveryAction) {
    RecoveryAction["RETRY"] = "retry";
    RecoveryAction["FAILOVER"] = "failover";
    RecoveryAction["CACHE_FALLBACK"] = "cache_fallback";
    RecoveryAction["SKIP"] = "skip";
    RecoveryAction["ABORT"] = "abort";
})(RecoveryAction || (exports.RecoveryAction = RecoveryAction = {}));
class RpcErrorClassifier {
    static ERROR_PATTERNS = [
        // Network and connection errors
        {
            pattern: /(network|connection|timeout|ENOTFOUND|ECONNREFUSED)/i,
            type: RpcErrorType.NETWORK_ERROR,
            recoveryAction: RecoveryAction.FAILOVER,
            retryable: true
        },
        {
            pattern: /(timeout|timed out)/i,
            type: RpcErrorType.TIMEOUT,
            recoveryAction: RecoveryAction.RETRY,
            retryable: true
        },
        // Rate limiting
        {
            pattern: /(rate limit|too many requests|429)/i,
            type: RpcErrorType.RATE_LIMIT,
            recoveryAction: RecoveryAction.FAILOVER,
            retryable: true
        },
        // Server errors
        {
            pattern: /(502|503|504|internal server error)/i,
            type: RpcErrorType.PROVIDER_ERROR,
            recoveryAction: RecoveryAction.FAILOVER,
            retryable: true
        },
        // Blockchain specific errors
        {
            pattern: /(insufficient funds|insufficient balance)/i,
            type: RpcErrorType.INSUFFICIENT_FUNDS,
            recoveryAction: RecoveryAction.ABORT,
            retryable: false
        },
        {
            pattern: /(execution reverted|revert)/i,
            type: RpcErrorType.EXECUTION_REVERTED,
            recoveryAction: RecoveryAction.ABORT,
            retryable: false
        },
        {
            pattern: /(block not found|header not found)/i,
            type: RpcErrorType.BLOCK_NOT_FOUND,
            recoveryAction: RecoveryAction.RETRY,
            retryable: true
        },
        // Request errors
        {
            pattern: /(invalid request|bad request|400)/i,
            type: RpcErrorType.INVALID_REQUEST,
            recoveryAction: RecoveryAction.ABORT,
            retryable: false
        }
    ];
    static classify(error, chainId, provider) {
        const message = this.extractErrorMessage(error);
        const code = this.extractErrorCode(error);
        // Find matching pattern
        const pattern = this.ERROR_PATTERNS.find(p => {
            if (typeof p.pattern === 'string') {
                return message.toLowerCase().includes(p.pattern.toLowerCase());
            }
            return p.pattern.test(message);
        });
        if (pattern) {
            return {
                type: pattern.type,
                code,
                message,
                chainId,
                provider,
                recoveryAction: pattern.recoveryAction,
                retryable: pattern.retryable,
                originalError: error
            };
        }
        // Default classification for unknown errors
        return {
            type: RpcErrorType.UNKNOWN,
            code,
            message,
            chainId,
            provider,
            recoveryAction: RecoveryAction.RETRY,
            retryable: true,
            originalError: error
        };
    }
    static extractErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (error?.message) {
            return error.message;
        }
        if (error?.data?.message) {
            return error.data.message;
        }
        if (error?.error?.message) {
            return error.error.message;
        }
        return JSON.stringify(error);
    }
    static extractErrorCode(error) {
        if (error?.code && typeof error.code === 'number') {
            return error.code;
        }
        if (error?.status && typeof error.status === 'number') {
            return error.status;
        }
        if (error?.data?.code && typeof error.data.code === 'number') {
            return error.data.code;
        }
        return undefined;
    }
}
exports.RpcErrorClassifier = RpcErrorClassifier;
class ChainSpecificErrorHandler {
    chainConfigs = new Map();
    constructor() {
        this.initializeChainConfigs();
    }
    initializeChainConfigs() {
        // Ethereum mainnet - more tolerant of network issues
        this.chainConfigs.set(1, {
            maxRetries: 3,
            baseDelayMs: 2000,
            specificErrors: {
                [RpcErrorType.RATE_LIMIT]: RecoveryAction.FAILOVER,
                [RpcErrorType.NETWORK_ERROR]: RecoveryAction.FAILOVER,
                [RpcErrorType.BLOCK_NOT_FOUND]: RecoveryAction.RETRY
            }
        });
        // Arbitrum - faster finality, less retry tolerance
        this.chainConfigs.set(42161, {
            maxRetries: 2,
            baseDelayMs: 1000,
            specificErrors: {
                [RpcErrorType.RATE_LIMIT]: RecoveryAction.FAILOVER,
                [RpcErrorType.NETWORK_ERROR]: RecoveryAction.FAILOVER,
                [RpcErrorType.BLOCK_NOT_FOUND]: RecoveryAction.CACHE_FALLBACK
            }
        });
        // Avalanche - handle C-Chain specific issues
        this.chainConfigs.set(43114, {
            maxRetries: 3,
            baseDelayMs: 1500,
            specificErrors: {
                [RpcErrorType.RATE_LIMIT]: RecoveryAction.FAILOVER,
                [RpcErrorType.NETWORK_ERROR]: RecoveryAction.FAILOVER,
                [RpcErrorType.BLOCK_NOT_FOUND]: RecoveryAction.RETRY
            }
        });
    }
    getRecoveryAction(error) {
        if (!error.chainId) {
            return error.recoveryAction;
        }
        const config = this.chainConfigs.get(error.chainId);
        if (!config) {
            return error.recoveryAction;
        }
        // Check for chain-specific overrides
        const chainSpecificAction = config.specificErrors[error.type];
        return chainSpecificAction || error.recoveryAction;
    }
    getMaxRetries(chainId) {
        const config = this.chainConfigs.get(chainId);
        return config?.maxRetries || 3;
    }
    getBaseDelay(chainId) {
        const config = this.chainConfigs.get(chainId);
        return config?.baseDelayMs || 1000;
    }
    shouldFailover(error) {
        const action = this.getRecoveryAction(error);
        return action === RecoveryAction.FAILOVER;
    }
    shouldRetry(error, attemptCount) {
        if (!error.retryable) {
            return false;
        }
        if (!error.chainId) {
            return attemptCount < 3;
        }
        const maxRetries = this.getMaxRetries(error.chainId);
        return attemptCount < maxRetries;
    }
    updateChainConfig(chainId, config) {
        const existing = this.chainConfigs.get(chainId) || {
            maxRetries: 3,
            baseDelayMs: 1000,
            specificErrors: {}
        };
        this.chainConfigs.set(chainId, {
            ...existing,
            ...config,
            specificErrors: {
                ...existing.specificErrors,
                ...(config.specificErrors || {})
            }
        });
    }
}
exports.ChainSpecificErrorHandler = ChainSpecificErrorHandler;
class ErrorMetricsCollector {
    metrics = {
        totalErrors: 0,
        errorsByType: {},
        errorsByChain: {},
        errorsByProvider: {},
        failoverCount: 0,
        retryCount: 0
    };
    recordError(error) {
        this.metrics.totalErrors++;
        this.metrics.errorsByType[error.type] =
            (this.metrics.errorsByType[error.type] || 0) + 1;
        if (error.chainId) {
            this.metrics.errorsByChain[error.chainId] =
                (this.metrics.errorsByChain[error.chainId] || 0) + 1;
        }
        if (error.provider) {
            this.metrics.errorsByProvider[error.provider] =
                (this.metrics.errorsByProvider[error.provider] || 0) + 1;
        }
    }
    recordFailover() {
        this.metrics.failoverCount++;
    }
    recordRetry() {
        this.metrics.retryCount++;
    }
    getMetrics() {
        return { ...this.metrics };
    }
    reset() {
        this.metrics = {
            totalErrors: 0,
            errorsByType: {},
            errorsByChain: {},
            errorsByProvider: {},
            failoverCount: 0,
            retryCount: 0
        };
    }
}
exports.ErrorMetricsCollector = ErrorMetricsCollector;
//# sourceMappingURL=RpcErrorHandler.js.map