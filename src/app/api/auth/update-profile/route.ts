import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const [existingUser] = await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.email, email.toLowerCase().trim()),
          ne(user.id, session.id)
        )
      )
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already taken by another user' },
        { status: 400 }
      );
    }

    // Update user profile
    await db
      .update(user)
      .set({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.id));

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
