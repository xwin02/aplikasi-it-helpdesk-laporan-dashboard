import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, securityAnswer } = body;

    if (!email || !securityAnswer) {
      return NextResponse.json(
        { error: 'Email and security answer are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email.toLowerCase().trim()))
      .limit(1);

    if (!foundUser) {
      // Don't reveal if email exists
      return NextResponse.json(
        { error: 'Invalid email or security answer' },
        { status: 400 }
      );
    }

    // Check if user has security answer set up
    if (!foundUser.securityAnswer) {
      // For users registered before security answer feature was added
      return NextResponse.json(
        { error: 'Security answer not set up for this account. Please contact administrator.' },
        { status: 400 }
      );
    }

    // Verify security answer using bcrypt
    const providedAnswer = securityAnswer.toLowerCase().trim();
    const isValid = await bcrypt.compare(providedAnswer, foundUser.securityAnswer);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or security answer' },
        { status: 400 }
      );
    }

    // Success - return user ID for password reset
    return NextResponse.json(
      { 
        message: 'Verification successful',
        userId: foundUser.id 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify security error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
