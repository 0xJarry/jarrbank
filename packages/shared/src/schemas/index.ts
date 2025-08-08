import { z } from 'zod';

// Address validation schema
export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Invalid Ethereum address format'
});

// Chain ID schema
export const chainIdSchema = z.union([
  z.literal(1),     // Ethereum
  z.literal(42161), // Arbitrum
  z.literal(43114), // Avalanche
]);

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

// Balance query schema
export const balanceQuerySchema = z.object({
  chainId: chainIdSchema,
  address: addressSchema
});

// Batch RPC request schema
export const rpcRequestSchema = z.object({
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.array(z.any())
});

export const batchRpcSchema = z.object({
  chainId: chainIdSchema,
  requests: z.array(rpcRequestSchema)
});

export type Address = z.infer<typeof addressSchema>;
export type ChainIdType = z.infer<typeof chainIdSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type BalanceQuery = z.infer<typeof balanceQuerySchema>;
export type RpcRequestType = z.infer<typeof rpcRequestSchema>;
export type BatchRpcRequest = z.infer<typeof batchRpcSchema>;