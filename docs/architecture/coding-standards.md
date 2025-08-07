# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **BigInt Precision:** Always use BigInt for financial calculations, never JavaScript numbers
- **Price Formatting:** Use shared formatting utilities to handle extreme token values
- **RPC Batching:** Group blockchain calls through RPC Batch Manager, never direct calls

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Tables | - | snake_case | `user_profiles` |
| Types | PascalCase | PascalCase | `Portfolio`, `WorkflowExecution` |
| Constants | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `DEFAULT_REFRESH_INTERVAL` |
