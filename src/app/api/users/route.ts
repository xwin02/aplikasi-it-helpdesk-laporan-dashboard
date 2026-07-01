import { NextResponse } from 'next/server';
import { db } from '@/db';
import { user as userTable } from '@/db/schema';
import { verifySession } from '@/lib/session';
import { eq, or } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Check authentication
    const sessionCookie = request.headers.get('cookie')?.split('; ').find(c => c.startsWith('session='))?.split('=')[1];
    
    if (!sessionCookie) {
      console.log('❌ No session cookie found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = await verifySession(sessionCookie);

    if (!currentUser) {
      console.log('❌ Invalid session');
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', currentUser.email, 'Role:', currentUser.role);

    // Only superadmin and teknisi can fetch users list
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'teknisi') {
      console.log('❌ Access denied for role:', currentUser.role);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get query parameter for filtering by role
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    console.log('🔍 Filtering by role:', roleFilter);

    // Fetch users based on role filter
    let usersList;
    
    if (roleFilter === 'teknisi') {
      // Get only teknisi users
      console.log('📡 Querying database for teknisi...');
      usersList = await db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
        })
        .from(userTable)
        .where(eq(userTable.role, 'teknisi'));
      
      console.log('✅ Found', usersList.length, 'teknisi users:', usersList);
    } else {
      // Get all users except regular users (superadmin + teknisi)
      console.log('📡 Querying database for superadmin + teknisi...');
      usersList = await db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
        })
        .from(userTable)
        .where(or(eq(userTable.role, 'superadmin'), eq(userTable.role, 'teknisi')));
      
      console.log('✅ Found', usersList.length, 'users:', usersList);
    }

    return NextResponse.json({
      success: true,
      users: usersList,
    });
  } catch (error) {
    console.error('❌ Fetch users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
