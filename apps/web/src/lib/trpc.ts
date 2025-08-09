import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../types/api';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001/trpc`;
  }
  
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/trpc`;
  }
  
  return 'http://localhost:3001/trpc';
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getTRPCUrl(),
      headers() {
        return {};
      },
    }),
  ],
});