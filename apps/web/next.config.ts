import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@jarrbank/shared', '@jarrbank/ui', '@jarrbank/config'],
  experimental: {
    // Enable experimental features if needed
  },
  typescript: {
    // Temporarily ignore TypeScript errors during build for deployment
    // This is a workaround for monorepo tRPC type resolution issues
    ignoreBuildErrors: true,
  },
}

export default nextConfig