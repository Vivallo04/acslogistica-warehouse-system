import { NextRequest, NextResponse } from 'next/server'
import { mongodb } from '@/lib/mongodb'
import { emailService } from '@/lib/email'
import { validateAuthToken, AUTH_RESPONSES } from '@/lib/server-auth'
import * as Sentry from '@sentry/nextjs'

// Define validation schema
interface FeedbackRequest {
  type: string
  subject: string
  message: string
  rating: number
  email: string
  userRole: string
  environment: any
}

function validateFeedback(data: any): data is FeedbackRequest {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return (
    typeof data.type === 'string' &&
    typeof data.subject === 'string' &&
    typeof data.message === 'string' &&
    typeof data.rating === 'number' &&
    typeof data.email === 'string' &&
    typeof data.userRole === 'string' &&
    data.environment &&
    data.type.length > 0 &&
    data.type.length <= 50 &&
    data.subject.length > 0 &&
    data.subject.length <= 200 &&
    data.message.length > 0 &&
    data.message.length <= 2000 &&
    emailRegex.test(data.email) &&
    data.rating >= 1 && data.rating <= 5 &&
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
    if (!validateFeedback(body)) {
      return NextResponse.json(
        { error: 'Datos de comentarios inválidos' },
        { status: 400 }
      )
    }

    // Connect to database
    await mongodb.connect()

    // Save feedback to MongoDB
    const feedbackId = await mongodb.saveFeedback({
      type: body.type,
      subject: body.subject,
      message: body.message,
      rating: body.rating,
      email: body.email,
      userRole: body.userRole,
      environment: body.environment,
      status: 'new'
    })

    // Send email notification (non-blocking)
    emailService.sendFeedbackNotification(body).catch(emailError => {
      console.error('Failed to send feedback notification email:', emailError)
      // Continue execution - don't fail the request
    })

    return NextResponse.json(
      { 
        success: true, 
        feedbackId,
        message: 'Comentarios enviados correctamente' 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error processing feedback:', error)
    Sentry.captureException(error, {
      tags: {
        section: 'feedback-submit'
      }
    })
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
    const feedback = await mongodb.getFeedback(50)

    return NextResponse.json({
      success: true,
      feedback
    })

  } catch (error) {
    console.error('Error fetching feedback:', error)
    Sentry.captureException(error, {
      tags: {
        section: 'feedback-fetch'
      }
    })
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}