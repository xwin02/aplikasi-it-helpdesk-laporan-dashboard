import { NextResponse } from 'next/server';
import { createUser } from '@/lib/simple-auth';
import { createSession, setSessionCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, securityAnswer } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!securityAnswer || securityAnswer.trim().length < 2) {
      return NextResponse.json(
        { error: 'Security answer is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    // Validate role (default to 'user' if not provided)
    const userRole = role && ['user', 'teknisi'].includes(role) ? role : 'user';

    // Create user with specified role (user or teknisi, not superadmin)
    const result = await createUser(email, password, name, userRole, securityAnswer);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Auto login after registration
    const token = await createSession(result.user);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
