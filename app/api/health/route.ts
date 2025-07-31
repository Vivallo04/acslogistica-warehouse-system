/**
 * Health Check API Route
 * Tests database connectivity and system status
 */

import { NextRequest, NextResponse } from 'next/server'
import { mysql_db } from '@/lib/mysql'
import type { ApiResponse } from '@/types/wms'

export async function GET(request: NextRequest) {
  try {
    // Test MySQL connection
    const mysqlStatus = await mysql_db.getConnectionStatus()
    
    // Test basic query
    let queryTest = false
    try {
      await mysql_db.query('SELECT 1 as test')
      queryTest = true
    } catch (error) {
      console.error('Query test failed:', error)
    }

    const response: ApiResponse<{
      status: string
      timestamp: Date
      database: {
        mysql: {
          connected: boolean
          message: string
          query_test: boolean
        }
      }
      environment: string
    }> = {
      success: true,
      data: {
        status: mysqlStatus.connected && queryTest ? 'healthy' : 'degraded',
        timestamp: new Date(),
        database: {
          mysql: {
            connected: mysqlStatus.connected,
            message: mysqlStatus.message,
            query_test: queryTest
          }
        },
        environment: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date()
    }

    const statusCode = response.data?.status === 'healthy' ? 200 : 503
    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    console.error('Health check error:', error)
    
    const response: ApiResponse = {
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}