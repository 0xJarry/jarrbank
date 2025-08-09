import { FastifyInstance } from 'fastify';
import { RpcConfig } from '../../../packages/web3/src/rpc/providers';
import { CacheConfig } from './db/redis';
import 'dotenv/config';
declare const config: {
    port: number;
    host: string;
    rpc: RpcConfig;
    cache: CacheConfig;
};
declare function createServer(): Promise<FastifyInstance>;
export { createServer, config };
