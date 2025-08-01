import { NextRequest, NextResponse } from 'next/server'
import { validateBatchScan } from '@/lib/validation'
import { formatValidationError } from '@/lib/validation'
import * as Sentry from '@sentry/nextjs'

// Interface for batch scan data
interface BatchScanData {
  id: string
  session_id: string
  tracking_number: string
  weight?: number
  recipient_name?: string
  notes?: string
  scanned_at: Date
}

// In-memory storage for batch scans (in production, use database)
const batchScans = new Map<string, BatchScanData[]>()

// Import batch sessions from main route (in production, use shared database)
const batchSessions = new Map<string, any>()

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const body = await request.json()

    // Validate session exists
    const session = batchSessions.get(sessionId)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Batch session does not exist or has expired',
        timestamp: new Date()
      }, { status: 404 })
    }

    // Check if session is active
    if (session.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Session not active',
        message: 'Batch session is not currently active',
        timestamp: new Date()
      }, { status: 400 })
    }

    // Validate scan data
    const validation = validateBatchScan({
      session_id: sessionId,
      ...body
    })
    
    if (!validation.success) {
      return NextResponse.json(formatValidationError(validation.error), { status: 400 })
    }

    const validated = validation.data

    // Check for duplicate tracking numbers in this session
    const existingScans = batchScans.get(sessionId) || []
    const duplicateCheck = existingScans.find(scan => 
      scan.tracking_number.toLowerCase() === validated.tracking_number.toLowerCase()
    )

    if (duplicateCheck) {
      return NextResponse.json({
        success: false,
        error: 'Duplicate tracking number',
        message: `Tracking number ${validated.tracking_number} has already been scanned in this batch session`,
        timestamp: new Date()
      }, { status: 409 })
    }

    // Create scan record
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const scanData: BatchScanData = {
      id: scanId,
      session_id: sessionId,
      tracking_number: validated.tracking_number,
      weight: validated.weight,
      recipient_name: validated.recipient_name,
      notes: validated.notes,
      scanned_at: new Date()
    }

    // Store scan
    if (!batchScans.has(sessionId)) {
      batchScans.set(sessionId, [])
    }
    batchScans.get(sessionId)!.push(scanData)

    // Update session package count
    session.packages_scanned += 1
    batchSessions.set(sessionId, session)

    // Track with Sentry
    Sentry.addBreadcrumb({
      category: 'batch',
      message: 'Package scanned in batch',
      data: { 
        sessionId, 
        trackingNumber: validated.tracking_number,
        packageCount: session.packages_scanned 
      },
      level: 'info'
    })

    return NextResponse.json({
      success: true,
      data: {
        scan: scanData,
        session_summary: {
          id: session.id,
          packages_scanned: session.packages_scanned,
          status: session.status
        }
      },
      message: 'Package scanned successfully',
      timestamp: new Date()
    }, { status: 201 })

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: 'batch-scan',
        sessionId: params.sessionId
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process batch scan',
      timestamp: new Date()
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Validate session exists
    const session = batchSessions.get(sessionId)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Batch session does not exist',
        timestamp: new Date()
      }, { status: 404 })
    }

    // Get scans for this session
    const scans = batchScans.get(sessionId) || []
    const paginatedScans = scans.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedScans,
      pagination: {
        total: scans.length,
        limit,
        offset,
        has_more: offset + limit < scans.length
      },
      session_summary: {
        id: session.id,
        packages_scanned: session.packages_scanned,
        status: session.status,
        started_at: session.started_at
      },
      timestamp: new Date()
    })

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: 'batch-scan-list',
        sessionId: params.sessionId
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve batch scans',
      timestamp: new Date()
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const searchParams = request.nextUrl.searchParams
    const scanId = searchParams.get('scan_id')

    if (!scanId) {
      return NextResponse.json({
        success: false,
        error: 'Missing scan ID',
        message: 'Scan ID is required',
        timestamp: new Date()
      }, { status: 400 })
    }

    // Validate session exists
    const session = batchSessions.get(sessionId)
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        message: 'Batch session does not exist',
        timestamp: new Date()
      }, { status: 404 })
    }

    // Get scans for this session
    const scans = batchScans.get(sessionId) || []
    const scanIndex = scans.findIndex(scan => scan.id === scanId)

    if (scanIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Scan not found',
        message: 'Scan record does not exist',
        timestamp: new Date()
      }, { status: 404 })
    }

    // Remove scan
    scans.splice(scanIndex, 1)
    batchScans.set(sessionId, scans)

    // Update session package count
    session.packages_scanned = Math.max(0, session.packages_scanned - 1)
    batchSessions.set(sessionId, session)

    // Track with Sentry
    Sentry.addBreadcrumb({
      category: 'batch',
      message: 'Batch scan deleted',
      data: { sessionId, scanId },
      level: 'info'
    })

    return NextResponse.json({
      success: true,
      message: 'Scan deleted successfully',
      session_summary: {
        id: session.id,
        packages_scanned: session.packages_scanned,
        status: session.status
      },
      timestamp: new Date()
    })

  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        section: 'batch-scan-delete',
        sessionId: params.sessionId
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete batch scan',
      timestamp: new Date()
    }, { status: 500 })
  }
}