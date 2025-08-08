# Environment Setup Guide

## Overview

**Completed**
This project uses environment variables for configuration management with Zod validation to ensure type safety and proper configuration across different deployment environments.

## Required Environment Variables

### Development
Copy `.env.example` to `.env.local` in the `apps/web` directory and update the values:

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Staging
```bash
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.jarrbank.com
NEXT_PUBLIC_API_URL=https://api-staging.jarrbank.com
DATABASE_URL=postgresql://username:password@staging-db-host:5432/jarrbank
NEXTAUTH_SECRET=your-staging-secret
NEXTAUTH_URL=https://staging.jarrbank.com
```

### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://jarrbank.com
NEXT_PUBLIC_API_URL=https://api.jarrbank.com
DATABASE_URL=postgresql://username:password@production-db-host:5432/jarrbank
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://jarrbank.com
```

## Environment Validation

The project uses `@jarrbank/config` package to validate environment variables using Zod schemas. This ensures:

- Type safety at runtime
- Early detection of configuration issues
- Clear error messages for missing or invalid variables

## Usage in Code

```typescript
import { env } from '@jarrbank/config'

// Access validated environment variables
const appUrl = env.NEXT_PUBLIC_APP_URL
const nodeEnv = env.NODE_ENV
```

## Setup Instructions

1. **Development Setup:**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your development values
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Validate Configuration:**
   ```bash
   npm run dev
   # If environment variables are invalid, you'll see clear error messages
   ```

## Security Notes

- Never commit `.env.local` or production environment files to version control
- Use proper secrets management in production environments
- Validate all environment variables before deployment
- Use different secrets for each environment

## Troubleshooting

### Common Issues

1. **Missing Environment Variables:**
   - Check that all required variables are set
   - Ensure `.env.local` exists and has proper values

2. **Invalid URL Format:**
   - Ensure URLs include protocol (http:// or https://)
   - Check for trailing slashes or typos

3. **Environment Validation Errors:**
   - Check console output for specific validation error messages
   - Ensure values match expected types (URLs, strings, enums)