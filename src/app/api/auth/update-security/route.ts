import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { verifySession } from '@/lib/session';
import { db } from '@/db';
import { user, account } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
    const { currentPassword, securityAnswer } = body;

    if (!currentPassword || !securityAnswer) {
      return NextResponse.json(
        { error: 'Current password and security answer are required' },
        { status: 400 }
      );
    }

    if (securityAnswer.trim().length < 2) {
      return NextResponse.json(
        { error: 'Security answer must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Verify current password
    const [userAccount] = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, session.id),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    if (!userAccount || !userAccount.password) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 400 }
      );
    }

    const isValidPassword = await bcrypt.compare(currentPassword, userAccount.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash the security answer
    const hashedSecurityAnswer = await bcrypt.hash(
      securityAnswer.toLowerCase().trim(),
      10
    );

    // Update security answer
    await db
      .update(user)
      .set({
        securityAnswer: hashedSecurityAnswer,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.id));

    return NextResponse.json({
      success: true,
      message: 'Security answer updated successfully',
    });
  } catch (error) {
    console.error('Update security answer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
