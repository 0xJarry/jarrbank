# Tech Stack

This is the DEFINITIVE technology selection for the entire JarrBank project. This table serves as the single source of truth - all development must use these exact versions.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe development across full stack | Eliminates runtime errors for financial calculations and Web3 interactions |
| Frontend Framework | Next.js | 15.4.5 | React-based fullstack framework | App Router, optimized performance, excellent Vercel integration |
| UI Component Library | shadcn/ui | Latest | Accessible component system | High-quality components with Tailwind integration, WCAG AA compliance |
| State Management | TanStack Query + Zustand | v5 + v4 | Server state + client state management | Query handles RPC caching, Zustand for UI state |
| Backend Language | Node.js | 20 LTS | Server-side JavaScript runtime | Unified language across stack, excellent Web3 ecosystem |
| Backend Framework | Fastify | 4.x | High-performance web framework | 2x faster than Express, built-in JSON schema validation |
| API Style | REST + tRPC | tRPC v10 | Type-safe API with REST fallback | End-to-end type safety, REST for webhooks/external integrations |
| Database | PostgreSQL | 15+ | Relational database via Supabase | ACID compliance for financial data, excellent JSON support |
| Cache | Redis | 7.x | In-memory caching via Redis Cloud | RPC response caching, session management |
| File Storage | Supabase Storage | Latest | Object storage for exports/reports | Integrated with auth, cost-effective |
| Authentication | Supabase Auth + Wagmi | Latest + v2 | Web2 + Web3 authentication | Supabase for user sessions, Wagmi for wallet connections |
| Frontend Testing | Vitest + Testing Library | Latest | Component and unit testing | Faster than Jest, better TypeScript integration |
| Backend Testing | Vitest + Supertest | Latest | API endpoint testing | Consistent testing stack, excellent async support |
| E2E Testing | Playwright | Latest | Cross-browser workflow testing | Reliable for complex DeFi workflows, excellent debugging |
| Build Tool | Turborepo | Latest | Monorepo build orchestration | Intelligent caching, parallel execution |
| Bundler | Next.js built-in | 15.4.5 | Frontend bundling with Webpack/Turbopack | Optimized for production, automatic code splitting |
| IaC Tool | Terraform | 1.6+ | Infrastructure as code | Standardized infrastructure management across providers |
| CI/CD | GitHub Actions | Latest | Automated testing and deployment | Integrated with repository, extensive marketplace |
| Monitoring | Sentry + Vercel Analytics | Latest | Error tracking and performance | Production error tracking, user analytics |
| Logging | Pino + Axiom | Latest | Structured logging | High-performance logging with searchable aggregation |
| CSS Framework | Tailwind CSS | 3.4+ | Utility-first styling | Rapid UI development, excellent with shadcn/ui |
