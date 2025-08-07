# Unified Project Structure

Creating a Turborepo monorepo structure that accommodates both frontend and backend with clear package boundaries, optimized for DeFi development workflows and deployment efficiency.

```text
jarrbank/
├── .github/                    # CI/CD workflows and templates
│   ├── workflows/
│   │   ├── ci.yml             # Continuous integration pipeline
│   │   ├── deploy-staging.yml  # Staging deployment
│   │   ├── deploy-prod.yml     # Production deployment
│   │   └── security-scan.yml   # Security vulnerability scanning
│   └── ISSUE_TEMPLATE/
├── apps/                       # Application packages
│   ├── web/                    # Next.js 15 frontend application
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── portfolio/
│   │   │   │   │   ├── positions/
│   │   │   │   │   ├── workflows/
│   │   │   │   │   └── analytics/
│   │   │   │   ├── connect/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── globals.css
│   │   │   │   └── providers.tsx
│   │   │   ├── components/     # React components
│   │   │   │   ├── ui/        # shadcn/ui base components
│   │   │   │   ├── portfolio/ # Portfolio-specific components
│   │   │   │   ├── lp-positions/
│   │   │   │   ├── workflows/
│   │   │   │   ├── web3/
│   │   │   │   └── layout/
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   │   ├── usePortfolio.ts
│   │   │   │   ├── useWorkflow.ts
│   │   │   │   ├── useLPPositions.ts
│   │   │   │   └── useHealth.ts
│   │   │   ├── lib/           # Client utilities
│   │   │   │   ├── trpc.ts    # tRPC client setup
│   │   │   │   ├── wagmi.ts   # Wagmi configuration
│   │   │   │   └── utils.ts   # Shared utilities
│   │   │   ├── stores/        # Zustand state management
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── workflow.ts
│   │   │   │   └── preferences.ts
│   │   │   └── types/         # Frontend-specific types
│   │   ├── public/            # Static assets
│   │   │   ├── icons/
│   │   │   ├── protocol-logos/
│   │   │   └── manifest.json  # PWA manifest
│   │   ├── tests/             # Frontend test suites
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── e2e/
│   │   ├── .env.example
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── package.json
│   └── api/                    # Fastify backend application
│       ├── src/
│       │   ├── server.ts      # Fastify server entry point
│       │   ├── context.ts     # tRPC context creation
│       │   ├── router.ts      # Main tRPC router
│       │   ├── routers/       # tRPC route modules
│       │   │   ├── portfolio.ts
│       │   │   ├── lpPosition.ts
│       │   │   ├── workflow.ts
│       │   │   ├── token.ts
│       │   │   ├── analytics.ts
│       │   │   ├── user.ts
│       │   │   └── protocol.ts
│       │   ├── services/      # Business logic services
│       │   │   ├── RpcBatchManager.ts
│       │   │   ├── PortfolioAggregator.ts
│       │   │   ├── WorkflowEngine.ts
│       │   │   ├── HealthCalculator.ts
│       │   │   ├── PriceService.ts
│       │   │   └── NotificationService.ts
│       │   ├── adapters/      # External service adapters
│       │   │   ├── protocols/
│       │   │   │   ├── UniswapAdapter.ts
│       │   │   │   ├── TraderJoeAdapter.ts
│       │   │   │   ├── PharaohAdapter.ts
│       │   │   │   └── BlackholeAdapter.ts
│       │   │   ├── providers/ # Price/RPC providers
│       │   │   │   ├── MoralisProvider.ts
│       │   │   │   ├── DefiLlamaProvider.ts
│       │   │   │   ├── CoinMarketCapProvider.ts
│       │   │   │   ├── AlchemyProvider.ts
│       │   │   │   └── InfuraProvider.ts
│       │   │   └── blockchain/
│       │   ├── middleware/    # Fastify middleware
│       │   │   ├── auth.ts
│       │   │   ├── cors.ts
│       │   │   ├── rateLimit.ts
│       │   │   └── errorHandler.ts
│       │   ├── db/           # Database layer
│       │   │   ├── client.ts  # Supabase client
│       │   │   ├── repositories/
│       │   │   │   ├── PortfolioRepository.ts
│       │   │   │   ├── UserRepository.ts
│       │   │   │   ├── WorkflowRepository.ts
│       │   │   │   └── LPPositionRepository.ts
│       │   │   ├── migrations/
│       │   │   └── seeds/
│       │   ├── utils/        # Backend utilities
│       │   │   ├── bigint.ts  # BigInt handling utilities
│       │   │   ├── crypto.ts  # Cryptographic functions
│       │   │   ├── validation.ts # Input validation
│       │   │   └── formatting.ts # Data formatting
│       │   └── types/        # Backend-specific types
│       ├── tests/            # Backend test suites
│       │   ├── integration/  # API integration tests
│       │   ├── unit/         # Unit tests for services
│       │   └── fixtures/     # Test data fixtures
│       ├── .env.example
│       ├── .env
│       ├── Dockerfile        # Railway deployment
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/         # Shared TypeScript interfaces
│   │   │   │   ├── portfolio.ts # Portfolio data models
│   │   │   │   ├── workflow.ts  # Workflow definitions
│   │   │   │   ├── token.ts     # Token and pricing types
│   │   │   │   ├── user.ts      # User and preferences
│   │   │   │   └── protocol.ts  # Protocol definitions
│   │   │   ├── constants/     # Shared constants
│   │   │   │   ├── chains.ts    # Blockchain configurations
│   │   │   │   ├── protocols.ts # Protocol configurations
│   │   │   │   ├── tokens.ts    # Token lists and metadata
│   │   │   │   └── addresses.ts # Contract addresses
│   │   │   ├── utils/         # Shared utilities
│   │   │   │   ├── format.ts    # Number/currency formatting
│   │   │   │   ├── validate.ts  # Validation helpers
│   │   │   │   ├── web3.ts      # Web3 utilities
│   │   │   │   └── math.ts      # DeFi math operations
│   │   │   └── schemas/       # Zod validation schemas
│   │   │       ├── portfolio.ts
│   │   │       ├── workflow.ts
│   │   │       └── user.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── web3/                   # Web3 interaction package
│   │   ├── src/
│   │   │   ├── contracts/     # Contract ABIs and interactions
│   │   │   │   ├── erc20.ts
│   │   │   │   ├── uniswap-v2.ts
│   │   │   │   ├── uniswap-v3.ts
│   │   │   │   ├── trader-joe.ts
│   │   │   │   ├── pharaoh.ts
│   │   │   │   └── blackhole.ts
│   │   │   ├── rpc/           # RPC batching and management
│   │   │   │   ├── batch.ts
│   │   │   │   ├── cache.ts
│   │   │   │   └── providers.ts
│   │   │   ├── defi/          # DeFi calculation utilities
│   │   │   │   ├── impermanent-loss.ts
│   │   │   │   ├── apr-calculation.ts
│   │   │   │   ├── liquidity.ts
│   │   │   │   └── swaps.ts
│   │   │   └── wallet/        # Wallet connection utilities
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/    # Reusable components
│   │   │   │   ├── charts/    # Chart components
│   │   │   │   │   ├── PortfolioChart.tsx
│   │   │   │   │   ├── PerformanceChart.tsx
│   │   │   │   │   └── CompositionChart.tsx
│   │   │   │   ├── defi/      # DeFi-specific components
│   │   │   │   │   ├── TokenDisplay.tsx
│   │   │   │   │   ├── LPPositionCard.tsx
│   │   │   │   │   ├── HealthScoreBadge.tsx
│   │   │   │   │   └── NetworkBadge.tsx
│   │   │   │   └── forms/     # Form components
│   │   │   ├── hooks/         # Shared hooks
│   │   │   └── styles/        # Shared styles
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── eslint/
│       │   ├── base.js
│       │   ├── react.js
│       │   └── node.js
│       ├── typescript/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   └── node.json
│       └── jest/
├── tools/                      # Development and build tools
│   ├── build-scripts/
│   │   ├── clean.js
│   │   ├── typecheck.js
│   │   └── lint.js
│   ├── deployment/
│   │   ├── railway-deploy.sh
│   │   ├── vercel-deploy.sh
│   │   └── migrate-db.sh
│   └── development/
│       ├── dev-setup.js
│       ├── seed-db.js
│       └── generate-types.js
├── docs/                       # Project documentation
│   ├── prd.md                 # Product Requirements Document
│   ├── front-end-spec.md      # UI/UX Specification
│   ├── architecture.md        # This document
│   ├── api-reference.md       # API documentation
│   ├── deployment.md          # Deployment guide
│   └── contributing.md        # Development guidelines
├── .env.example                # Environment template
├── .gitignore                 # Git ignore patterns
├── .nvmrc                     # Node version specification
├── package.json               # Root package.json with workspace config
├── turbo.json                 # Turborepo configuration
├── tsconfig.json              # Root TypeScript configuration
└── README.md                  # Project overview and setup
```

## Monorepo Configuration

### Root Package.json

```json
{
  "name": "jarrbank",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "tools/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e --scope=web",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:migrate": "turbo run db:migrate --scope=api",
    "db:seed": "turbo run db:seed --scope=api",
    "generate:types": "turbo run generate:types",
    "deploy:staging": "turbo run build --filter=web --filter=api && npm run deploy:staging:execute",
    "deploy:prod": "turbo run build --filter=web --filter=api && npm run deploy:prod:execute"
  },
  "devDependencies": {
    "@changesets/cli": "^2.26.2",
    "@turbo/gen": "^1.10.7",
    "prettier": "^3.0.0",
    "turbo": "^1.10.7",
    "typescript": "^5.1.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "npm@10.2.0"
}
```

### Turborepo Configuration (turbo.json)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env", "**/.env.local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build", "generate:types"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "env": [
        "NEXT_PUBLIC_APP_URL",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "DATABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY"
      ]
    },
    "dev": {
      "dependsOn": ["^dev"],
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck", "generate:types"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    },
    "test:e2e": {
      "dependsOn": ["build", "^build"],
      "cache": false
    },
    "generate:types": {
      "cache": false
    },
    "clean": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

## Development Workflow

### Local Development Setup

```bash