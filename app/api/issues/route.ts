import { NextRequest, NextResponse } from 'next/server'
import { mongodb } from '@/lib/mongodb'
import { emailService } from '@/lib/email'

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
  environment: any
}

function validateIssue(data: any): data is IssueRequest {
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
    data.title.length > 0 &&
    data.description.length > 0 &&
    ['bug', 'crash', 'performance', 'ui_issue'].includes(data.type) &&
    ['low', 'medium', 'high', 'critical'].includes(data.priority)
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

    // Send email notification
    await emailService.sendIssueNotification({ ...body, issueId })

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
    // Optional: Add authentication check here
    
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