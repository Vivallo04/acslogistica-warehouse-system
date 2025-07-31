import { NextRequest, NextResponse } from 'next/server'
import { mongodb } from '@/lib/mongodb'
import { emailService } from '@/lib/email'

// Define validation schema (we'll use basic validation for now)
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
  return (
    typeof data.type === 'string' &&
    typeof data.subject === 'string' &&
    typeof data.message === 'string' &&
    typeof data.rating === 'number' &&
    typeof data.email === 'string' &&
    typeof data.userRole === 'string' &&
    data.environment &&
    data.type.length > 0 &&
    data.subject.length > 0 &&
    data.message.length > 0
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

    // Send email notification
    await emailService.sendFeedbackNotification(body)

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
    const feedback = await mongodb.getFeedback(50)

    return NextResponse.json({
      success: true,
      feedback
    })

  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}