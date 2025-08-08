# Deployment Guide

<!-- Test deployment trigger -->

## Overview
**Completed**
This project is configured for deployment on Vercel with automated CI/CD through GitHub Actions.

## Deployment Configuration

### Vercel Setup

1. **Connect Repository to Vercel:**
   - Login to [Vercel](https://vercel.com)
   - Import the GitHub repository
   - Configure project settings

2. **Environment Variables in Vercel:**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_API_URL=https://api.your-domain.com
   ```

3. **Build Configuration:**
   - Framework: Next.js
   - Build Command: Automatically detected
   - Output Directory: `apps/web/.next`

### GitHub Secrets Configuration

For automated deployment, add these secrets to your GitHub repository:

```
VERCEL_TOKEN=your-vercel-token
ORG_ID=your-vercel-org-id
PROJECT_ID=your-vercel-project-id
SNYK_TOKEN=your-snyk-token (optional, for security scanning)
```

## Deployment Process

### Automatic Deployment

1. **Push to Main Branch:**
   ```bash
   git push origin main
   ```

2. **CI/CD Pipeline:**
   - Runs linting and type checking
   - Executes tests
   - Builds the project
   - Performs security audit
   - Deploys to Vercel
   - Runs health check

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Health Check Endpoint

The application includes a health check endpoint at `/api/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "message": "Hello JarrBank",
  "project": {
    "name": "JarrBank",
    "description": "Multi-chain DeFi portfolio management platform",
    "version": "1.0.0"
  },
  "environment": "production",
  "uptime": 123.456,
  "services": {
    "database": "not_connected",
    "api": "healthy",
    "frontend": "healthy"
  }
}
```

## Monitoring and Observability

### Vercel Analytics
- Automatic deployment monitoring
- Performance metrics
- Error tracking

### Health Monitoring
- Health check endpoint: `/api/health`
- Automated health checks in CI/CD
- Service status monitoring

## Environment-Specific Deployments

### Development
- Branch: `develop`
- URL: Preview deployments
- Environment: `development`

### Staging
- Branch: `staging` (if configured)
- URL: `https://staging-jarrbank.vercel.app`
- Environment: `staging`

### Production
- Branch: `main`
- URL: `https://jarrbank.vercel.app`
- Environment: `production`

## Troubleshooting

### Common Deployment Issues

1. **Build Failures:**
   - Check TypeScript errors
   - Verify environment variables
   - Review build logs in Vercel dashboard

2. **Health Check Failures:**
   - Check API endpoint accessibility
   - Verify environment configuration
   - Review function logs

3. **Environment Variable Issues:**
   - Ensure all required variables are set
   - Check variable naming (NEXT_PUBLIC_ prefix for client-side)
   - Verify values in Vercel dashboard

### Debug Commands

```bash
# Check build locally
npm run build

# Test health endpoint locally
curl http://localhost:3000/api/health

# Verify environment variables
npm run dev
```

## Security Considerations

1. **Environment Variables:**
   - Never commit secrets to version control
   - Use Vercel's environment variable management
   - Separate secrets for different environments

2. **API Security:**
   - Health endpoint is public (no sensitive data exposed)
   - Future APIs should include proper authentication
   - Use HTTPS in production

3. **Dependency Security:**
   - Automated security scanning with Snyk
   - Regular dependency updates
   - Monitor security advisories