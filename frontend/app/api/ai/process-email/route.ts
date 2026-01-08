import { NextRequest, NextResponse } from 'next/server'
import { processOpportunityEmail } from '../../../../../backend/controllers/aiController'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { emailContent } = body

    // Validate that email content is present
    if (!emailContent || typeof emailContent !== 'string' || emailContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'emailContent is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Process the email using the AI controller
    const result = await processOpportunityEmail(emailContent)

    // Log for debugging
    console.log('API Route - Result:', JSON.stringify(result, null, 2))

    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error: any) {
    console.error('Error in API route /api/ai/process-email:', error)
    return NextResponse.json(
      { error: error.message || 'Error processing email' },
      { status: 500 }
    )
  }
}

