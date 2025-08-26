import { NextRequest, NextResponse } from 'next/server'
import { validateBatchSession } from '@/lib/validation'
import { formatValidationError } from '@/lib/validation'
import * as Sentry from '@sentry/nextjs'

// In-memory session storage (in production, use database)
const batchSessions = new Map<string, {
  id: string
  user_id: number
  user_name: string
  default_pallet_id?: number
  default_pallet_name?: string
  default_priority: string
  default_weight_unit: string
  default_contenido?: string
  default_peso?: string
  default_casillero?: string
  packages_scanned: number
  started_at: Date
  completed_at?: Date
  status: 'active' | 'paused' | 'completed' | 'cancelled'
}>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = validateBatchSession(body)
    if (!validation.success) {
      return NextResponse.json(formatValidationError(validation.error), { status: 400 })
    }

    const validated = validation.data

    // Create new batch session
    const sessionId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newSession = {
      id: sessionId,
      user_id: 1, // TODO: Get from authentication
      user_name: 'Usuario', // TODO: Get from authentication
      default_pallet_id: validated.default_pallet_id,
      default_pallet_name: validated.default_pallet_id ? `Pallet-${validated.default_pallet_id}` : undefined,
      default_priority: validated.default_priority,
      default_weight_unit: validated.default_weight_unit,
      default_contenido: body.default_contenido,
      default_peso: body.default_peso,
      default_casillero: body.default_casillero,
      packages_scanned: 0,
      started_at: new Date(),
      status: 'active' as const
    }

    // Store session
    batchSessions.set(sessionId, newSession)

    // Track with Sentry
    Sentry.addBreadcrumb({
      category: 'batch',
      message: 'Batch session created',
      data: { sessionId, user_id: newSession.user_id },
      level: 'info'
    })

    return NextResponse.json({
      success: true,
      data: newSession,
      message: 'Batch session created successfully',
      timestamp: new Date()
    }, { status: 201 })

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: 'batch-create',
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create batch session',
      timestamp: new Date()
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')
    const userId = searchParams.get('user_id')

    if (sessionId) {
      // Get specific session
      const session = batchSessions.get(sessionId)
      
      if (!session) {
        return NextResponse.json({
          success: false,
          error: 'Session not found',
          message: 'Batch session does not exist',
          timestamp: new Date()
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: session,
        timestamp: new Date()
      })
    }

    // Get all sessions (optionally filter by user)
    let sessions = Array.from(batchSessions.values())
    
    if (userId) {
      const userIdNum = parseInt(userId, 10)
      sessions = sessions.filter(session => session.user_id === userIdNum)
    }

    return NextResponse.json({
      success: true,
      data: sessions,
      timestamp: new Date()
    })

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: 'batch-list',
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve batch sessions',
      timestamp: new Date()
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, status, ...updates } = body

    if (!session_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing session ID',
        message: 'Session ID is required',
        timestamp: new Date()
      }, { status: 400 })
    }

    const session = batchSessions.get(session_id)
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Batch session does not exist',
        timestamp: new Date()
      }, { status: 404 })
    }

    // Update session
    const updatedSession = {
      ...session,
      ...updates,
      status: status || session.status,
      completed_at: status === 'completed' ? new Date() : session.completed_at
    }

    batchSessions.set(session_id, updatedSession)

    // Track with Sentry
    Sentry.addBreadcrumb({
      category: 'batch',
      message: 'Batch session updated',
      data: { sessionId: session_id, status, updates },
      level: 'info'
    })

    return NextResponse.json({
      success: true,
      data: updatedSession,
      message: 'Batch session updated successfully',
      timestamp: new Date()
    })

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: 'batch-update',
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update batch session',
      timestamp: new Date()
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing session ID',
        message: 'Session ID is required',
        timestamp: new Date()
      }, { status: 400 })
    }

    const session = batchSessions.get(sessionId)
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Batch session does not exist',
        timestamp: new Date()
      }, { status: 404 })
    }

    // Delete session
    batchSessions.delete(sessionId)

    // Track with Sentry
    Sentry.addBreadcrumb({
      category: 'batch',
      message: 'Batch session deleted',
      data: { sessionId },
      level: 'info'
    })

    return NextResponse.json({
      success: true,
      message: 'Batch session deleted successfully',
      timestamp: new Date()
    })

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: 'batch-delete',
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete batch session',
      timestamp: new Date()
    }, { status: 500 })
  }
}