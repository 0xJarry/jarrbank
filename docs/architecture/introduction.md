# Introduction

This document outlines the complete fullstack architecture for JarrBank, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project

**Evaluation:**
- The PRD specifies Next.js 15.4.5 with TypeScript as the frontend choice
- Backend requirements include Node.js with Fastify for API performance
- Monorepo structure is explicitly requested
- Web3 integration with Wagmi v2 + VIEM is specified
- Complex DeFi-specific requirements that may not align with general starters

**Recommendation:** While there are excellent Web3 starter templates like T3 Stack or Create Web3 DApp, the specific requirements for batched RPC infrastructure, multi-chain portfolio management, and workflow automation suggest a **greenfield approach** would be most appropriate. This allows complete control over the architecture needed for the complex DeFi automation features.

**Decision:** N/A - Greenfield project with custom architecture optimized for DeFi portfolio management requirements.

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-06 | 1.0 | Initial fullstack architecture creation | Winston (Architect) |
