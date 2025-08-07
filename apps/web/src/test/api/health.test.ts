import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../../app/api/health/route'

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, options) => ({
      status: options?.status || 200,
      headers: options?.headers || {},
      json: () => Promise.resolve(data),
    })),
  },
}))

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock process.uptime
    vi.spyOn(process, 'uptime').mockReturnValue(123.456)
  })

  it('returns health status successfully', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      status: 'healthy',
      message: 'Hello JarrBank',
      project: {
        name: 'JarrBank',
        description: 'Multi-chain DeFi portfolio management platform',
        version: '1.0.0',
      },
      environment: 'test',
      uptime: 123.456,
      services: {
        database: 'not_connected',
        api: 'healthy',
        frontend: 'healthy',
      },
    })

    expect(data.timestamp).toBeDefined()
    expect(new Date(data.timestamp)).toBeInstanceOf(Date)
  })

  it('includes proper cache headers', async () => {
    const response = await GET()

    expect(response.headers).toMatchObject({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    })
  })

  it('handles errors gracefully', async () => {
    // Mock process.uptime to throw an error
    vi.spyOn(process, 'uptime').mockImplementation(() => {
      throw new Error('Process error')
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toMatchObject({
      status: 'unhealthy',
      message: 'Health check failed',
      error: 'Process error',
    })

    expect(data.timestamp).toBeDefined()
  })
})