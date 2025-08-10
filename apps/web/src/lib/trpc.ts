import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../types/api';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCUrl() {
  // Use environment variable for production API URL
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/trpc`;
  }
  
  // Development: Use local API server
  if (typeof window !== 'undefined') {
    // Browser environment
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // In development, API runs on port 3001
    return `${protocol}//${hostname}:3001/trpc`;
  }
  
  // Server-side fallback
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