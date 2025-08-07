import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Perform basic health checks
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Hello JarrBank',
      project: {
        name: 'JarrBank',
        description: 'Multi-chain DeFi portfolio management platform',
        version: '1.0.0',
      },
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {
        database: 'not_connected', // Will be updated when database is added
        api: 'healthy',
        frontend: 'healthy',
      },
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}