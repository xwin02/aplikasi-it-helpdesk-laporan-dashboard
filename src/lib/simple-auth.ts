// Simple custom authentication without Better-Auth
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { user, account } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Find user by email
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!foundUser) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    // Find account (password)
    const [foundAccount] = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, foundUser.id),
          eq(account.providerId, 'credential')
        )
      )
      .limit(1);

    if (!foundAccount || !foundAccount.password) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, foundAccount.password);

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    // Success!
    return {
      success: true,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      },
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: string = 'user',
  securityAnswer?: string
): Promise<AuthResult> {
  try {
    // Check if user exists
    const [existing] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existing) {
      return {
        success: false,
        error: 'User already exists',
      };
    }

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Hash security answer if provided
    const hashedSecurityAnswer = securityAnswer 
      ? await hashPassword(securityAnswer.toLowerCase().trim())
      : undefined;
    
    await db.insert(user).values({
      id: userId,
      email,
      name,
      role,
      emailVerified: true,
      securityAnswer: hashedSecurityAnswer,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create account with password
    const hashedPassword = await hashPassword(password);
    
    await db.insert(account).values({
      id: `account_${userId}`,
      accountId: email,
      providerId: 'credential',
      userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      user: {
        id: userId,
        email,
        name,
        role,
      },
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      error: 'Failed to create user',
    };
  }
}
