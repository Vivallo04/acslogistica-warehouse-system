/**
 * Health Check API Route
 * Tests database connectivity and system status
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/wms'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  try {
    // Test WMS backend API connectivity instead of direct database access
    let backendStatus = { connected: false, message: 'Backend unavailable' }
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${apiBaseUrl}/api/health`, { 
        method: 'GET',
        signal: controller.signal 
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        backendStatus = { connected: true, message: 'Backend API accessible' }
      } else {
        backendStatus = { connected: false, message: `Backend returned ${response.status}` }
      }
    } catch (error) {
      backendStatus = { 
        connected: false, 
        message: error instanceof Error ? error.message : 'Backend connection failed' 
      }
    }

    const response: ApiResponse<{
      status: string
      timestamp: Date
      backend: {
        connected: boolean
        message: string
      }
      environment: string
    }> = {
      success: true,
      data: {
        status: backendStatus.connected ? 'healthy' : 'degraded',
        timestamp: new Date(),
        backend: backendStatus,
        environment: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date()
    }

    const statusCode = response.data?.status === 'healthy' ? 200 : 503
    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    console.error('Health check error:', error)
    Sentry.captureException(error, {
      tags: {
        section: 'health-check'
      }
    })
    
    const response: ApiResponse = {
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}