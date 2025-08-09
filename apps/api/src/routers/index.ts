import { initTRPC } from '@trpc/server';
import { portfolioRouter } from './portfolio.router';

const t = initTRPC.create();

export const appRouter = t.router({
  portfolio: portfolioRouter
});

export type AppRouter = typeof appRouter;