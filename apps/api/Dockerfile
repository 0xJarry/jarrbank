# Multi-stage build for API deployment
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat

# Copy root package files for workspace resolution
COPY package.json package-lock.json ./
COPY turbo.json ./

# Copy workspace package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web3/package.json ./packages/web3/

# Install dependencies
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY . .

# Build only the packages that API depends on
RUN npx turbo run build --filter=@jarrbank/shared --filter=@jarrbank/web3

# Build API
RUN npx turbo run build --filter=@jarrbank/api

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy necessary files from builder
COPY --from=builder --chown=fastify:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=fastify:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=fastify:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=fastify:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=fastify:nodejs /app/packages/web3/dist ./packages/web3/dist
COPY --from=builder --chown=fastify:nodejs /app/packages/web3/package.json ./packages/web3/
COPY --from=builder --chown=fastify:nodejs /app/package.json ./
COPY --from=builder --chown=fastify:nodejs /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

USER fastify

# Environment variables (Railway provides PORT)
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Expose port (Railway will override with PORT env var)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start the API server
CMD ["node", "/app/apps/api/dist/server.js"]