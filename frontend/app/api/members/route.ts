import { NextRequest, NextResponse } from 'next/server'
import { createMember } from '../../../../backend/controllers/memberController'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { name, email, role, skillIds } = body

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'name, email, and role are required fields' },
        { status: 400 }
      )
    }

    // Validate that skillIds is an array
    if (!Array.isArray(skillIds)) {
      return NextResponse.json(
        { error: 'skillIds must be an array' },
        { status: 400 }
      )
    }

    // Create the member using the backend controller
    const result = await createMember({
      fullName: name,
      email: email,
      role: role,
      skillIds: skillIds || [],
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Could not create member' },
        { status: 500 }
      )
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error in API route /api/members:', error)
    return NextResponse.json(
      { error: error.message || 'Error creating member' },
      { status: 500 }
    )
  }
}

