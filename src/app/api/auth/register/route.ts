import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password, role } = body;

    // Validate all required fields are present
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { 
          error: 'All fields are required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate fields are not empty strings
    if (email.trim() === '' || name.trim() === '' || password.trim() === '' || role.trim() === '') {
      return NextResponse.json(
        { 
          error: 'All fields are required',
          code: 'EMPTY_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate email format (basic check for @ symbol)
    if (!email.includes('@')) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        },
        { status: 400 }
      );
    }

    // Validate password length (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 8 characters',
          code: 'INVALID_PASSWORD_LENGTH'
        },
        { status: 400 }
      );
    }

    // Validate role is one of the allowed values
    const allowedRoles = ['user', 'teknisi', 'admin'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { 
          error: 'Role must be one of: user, teknisi, admin',
          code: 'INVALID_ROLE'
        },
        { status: 400 }
      );
    }

    // Create user using better-auth signUp method
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
        name: name.trim()
      }
    });

    // Check if signup was successful
    if (!signUpResult) {
      return NextResponse.json(
        { 
          error: 'Failed to create user',
          code: 'SIGNUP_FAILED'
        },
        { status: 400 }
      );
    }

    // Update the user role immediately after creation
    await db.update(user)
      .set({ 
        role,
        updatedAt: new Date()
      })
      .where(eq(user.email, email.toLowerCase().trim()));

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user: {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          role
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('POST /api/register error:', error);

    // Handle better-auth specific errors (like duplicate email)
    if (error.message && error.message.includes('unique')) {
      return NextResponse.json(
        { 
          error: 'Email already exists',
          code: 'DUPLICATE_EMAIL'
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error.message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}