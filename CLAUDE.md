# Claude Code - Project Guidelines

## CRITICAL: Pre-Deployment Checklist

**ALWAYS run these checks BEFORE pushing any code changes:**

### 1. Build Dependencies First (for monorepo)
```bash
npm run build:deps
```

### 2. Type Check
```bash
# From root
npm run typecheck

# Or specifically for web app
cd apps/web && npm run typecheck
```

### 3. Run Tests
```bash
npm run test
```

### 4. Build the Application
```bash
cd apps/web && npm run build
```

## Common Issues & Solutions

### Module Resolution Errors
- **Problem**: `Module not found: Can't resolve '@jarrbank/shared/src/...'`
- **Solution**: Import from package root: `import { X } from '@jarrbank/shared'`
- **Why**: TypeScript compiles to `dist/`, not `src/`

### Missing Exports
- **Problem**: `Module has no exported member 'X'`
- **Solution**: Ensure the export is added to the package's index file
- **Check**: `packages/[package]/src/index.ts` or relevant barrel export

### API Type Import Errors
- **Problem**: `Module '@jarrbank/api' has no exported member 'AppRouter'`
- **Solution**: 
  1. Ensure `apps/api/src/index.ts` exists and exports `AppRouter` type
  2. API package must have proper `main` and `types` fields in package.json
  3. Import from package root: `import type { AppRouter } from '@jarrbank/api'`
- **Why**: API package needs proper export structure for tRPC types

### Vercel Deployment Failures
- **Always build locally first**: The CI/deployment uses the same commands
- **Check imports**: Ensure all imports resolve correctly
- **Build order**: Dependencies must build before the app

## Project Structure

```
jarrbank/
├── apps/
│   ├── web/          # Next.js frontend (imports from packages)
│   └── api/          # Fastify API server
├── packages/
│   ├── shared/       # Must export everything through src/index.ts
│   └── web3/         # Must export everything through src/index.ts
```

## Import Rules

### ✅ DO
- Import from package root: `import { X } from '@jarrbank/shared'`
- Export all public APIs through index files
- Build dependencies before running the app

### ❌ DON'T
- Import from src paths: `import { X } from '@jarrbank/shared/src/utils'`
- Forget to export new utilities from index files
- Push without running typecheck locally

## CI/CD Workflow

1. **GitHub Actions CI** runs on push (tests, typecheck, build)
2. **Vercel deployment** triggers ONLY after CI passes
3. **Never push directly** without local validation

## Quick Validation Script

Add this to your workflow:
```bash
# Run this before pushing
npm run build:deps && npm run typecheck && npm run test && cd apps/web && npm run build
```

## Troubleshooting Deployments

If Vercel deployment fails:
1. Check the build logs for the exact error
2. Reproduce locally with: `cd apps/web && npm run build:deps && npm run build`
3. Fix type errors first, then build errors
4. Ensure all imports are properly exported from package index files