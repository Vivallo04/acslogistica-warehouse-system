import { NextRequest, NextResponse } from 'next/server'
import { mongodb } from '@/lib/mongodb'
import { emailService } from '@/lib/email'
import { validateAuthToken, AUTH_RESPONSES } from '@/lib/server-auth'

// Define environment interface for type safety
interface Environment {
  userAgent: string
  url: string
  timestamp: string
}

// Define validation schema
interface IssueRequest {
  type: string
  priority: string
  title: string
  description: string
  stepsToReproduce?: string
  expectedBehavior?: string
  actualBehavior?: string
  email: string
  userRole: string
  includeScreenshot: boolean
  environment: Environment
}

function validateIssue(data: any): data is IssueRequest {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return (
    typeof data.type === 'string' &&
    typeof data.priority === 'string' &&
    typeof data.title === 'string' &&
    typeof data.description === 'string' &&
    typeof data.email === 'string' &&
    typeof data.userRole === 'string' &&
    typeof data.includeScreenshot === 'boolean' &&
    data.environment &&
    data.type.length > 0 &&
    data.type.length <= 50 &&
    data.title.length > 0 &&
    data.title.length <= 200 &&
    data.description.length > 0 &&
    data.description.length <= 2000 &&
    emailRegex.test(data.email) &&
    ['bug', 'crash', 'performance', 'ui_issue'].includes(data.type) &&
    ['low', 'medium', 'high', 'critical'].includes(data.priority) &&
    validateEnvironment(data.environment)
  )
}

function validateEnvironment(env: any): boolean {
  return (
    typeof env === 'object' &&
    env !== null &&
    typeof env.userAgent === 'string' &&
    typeof env.url === 'string' &&
    typeof env.timestamp === 'string'
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request data
    if (!validateIssue(body)) {
      return NextResponse.json(
        { error: 'Datos de incidencia inválidos' },
        { status: 400 }
      )
    }

    // Connect to database
    await mongodb.connect()

    // Save issue to MongoDB
    const issueId = await mongodb.saveIssue({
      type: body.type,
      priority: body.priority,
      title: body.title,
      description: body.description,
      stepsToReproduce: body.stepsToReproduce,
      expectedBehavior: body.expectedBehavior,
      actualBehavior: body.actualBehavior,
      email: body.email,
      userRole: body.userRole,
      environment: body.environment,
      status: 'new'
    })

    // Send email notification (non-blocking)
    emailService.sendIssueNotification({ ...body, issueId }).catch(emailError => {
      console.error('Failed to send issue notification email:', emailError)
      // Continue execution - don't fail the request
    })

    return NextResponse.json(
      { 
        success: true, 
        issueId,
        message: 'Incidencia reportada correctamente' 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error processing issue report:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


export async function GET(request: NextRequest) {
  try {
    // Authentication check required for sensitive data
    const authResult = await validateAuthToken(request)
    if (!authResult.valid) {
      return NextResponse.json(
        AUTH_RESPONSES.UNAUTHORIZED,
        { status: 401 }
      )
    }
    
    await mongodb.connect()
    const issues = await mongodb.getIssues(50)

    return NextResponse.json({
      success: true,
      issues
    })

  } catch (error) {
    console.error('Error fetching issues:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}