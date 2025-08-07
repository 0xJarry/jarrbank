# Technical Assumptions

## Repository Structure: Monorepo

Single repository containing frontend, backend API, shared types, and smart contract interaction packages. Enables atomic commits across full-stack changes, simplified dependency management, and coordinated deployment pipeline. Uses workspace structure for package isolation while maintaining development velocity.

## Service Architecture

**Hybrid Monolith with Microservice Boundaries:** Core application deployed as monolithic Next.js application with separate services for intensive operations. Portfolio data service handles RPC batching and caching. Workflow automation service manages transaction orchestration. User preference service manages customization data. This approach balances development simplicity with scaling flexibility while staying within solo developer constraints.

## Testing Requirements

**Unit + Integration Testing Focus:** Comprehensive unit tests for business logic, integration tests for Web3 interactions and RPC batching, end-to-end tests for critical user workflows (wallet connection, portfolio loading, workflow execution). Manual testing convenience methods for multi-chain scenarios and transaction simulation validation. Prioritizes automated testing for core automation features while accepting manual validation for complex DeFi protocol integrations.

## Additional Technical Assumptions and Requests

**Frontend Technology Stack:**
- Next.js 15.4.5 (current stable) with TypeScript for type safety and development velocity
- Tailwind CSS + shadcn/ui for rapid UI development with consistent, accessible component library
- React Query (TanStack Query) for efficient RPC response caching and state management
- Wagmi v2 + VIEM for Web3 wallet connections and blockchain interactions

**Backend Infrastructure:**
- Node.js with Fastify for API performance optimization
- PostgreSQL for user preferences, workflow history, and analytical data
- Redis for RPC response caching and session management
- Alchemy/Infura for primary RPC endpoints with fallback providers

**DevOps and Deployment:**
- Vercel for frontend deployment leveraging Next.js 15 optimizations
- Railway or Render for backend services with PostgreSQL hosting
- GitHub Actions for CI/CD pipeline with automated testing and deployment
- Environment-based configuration for development, staging, and production

**Security and Compliance:**
- No private key storage - all transactions user-initiated through connected wallets
- Future consideration: EOA (Externally Owned Account) delegation architecture leveraging EIP-7702 for batched transaction execution without private key storage or contract deployment
- JWT-based authentication for user preferences and workflow history
- Rate limiting on public endpoints with DDoS protection
- Transaction simulation before execution with user confirmation requirements
- Architecture designed to accommodate EIP-7702 account delegation for seamless multi-transaction batching when available

**Performance Optimization:**
- Batched RPC calls with intelligent request grouping to minimize rate limiting
- Progressive data loading with skeleton states for immediate UI feedback
- Service worker caching for static assets and price data with configurable TTL
- Lazy loading for complex LP position details and historical data
