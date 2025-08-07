import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@jarrbank/shared', '@jarrbank/ui', '@jarrbank/config'],
  experimental: {
    // Enable experimental features if needed
  },
}

export default nextConfig