import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projectMembers, projects, user } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const VALID_ROLES = ['owner', 'admin', 'member', 'viewer'];

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Validate projectId parameter
    if (!projectId) {
      return NextResponse.json({ 
        error: 'Project ID is required',
        code: 'MISSING_PROJECT_ID' 
      }, { status: 400 });
    }

    if (isNaN(parseInt(projectId))) {
      return NextResponse.json({ 
        error: 'Valid project ID is required',
        code: 'INVALID_PROJECT_ID' 
      }, { status: 400 });
    }

    // Verify project exists
    const project = await db.select()
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Fetch project members with user details using join
    const members = await db.select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image
    })
      .from(projectMembers)
      .leftJoin(user, eq(projectMembers.userId, user.id))
      .where(eq(projectMembers.projectId, parseInt(projectId)))
      .orderBy(asc(projectMembers.joinedAt));

    return NextResponse.json(members, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, userId, role = 'member' } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json({ 
        error: 'Project ID is required',
        code: 'MISSING_PROJECT_ID' 
      }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    // Validate projectId is valid integer
    if (isNaN(parseInt(projectId.toString()))) {
      return NextResponse.json({ 
        error: 'Valid project ID is required',
        code: 'INVALID_PROJECT_ID' 
      }, { status: 400 });
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ 
        error: `Role must be one of: ${VALID_ROLES.join(', ')}`,
        code: 'INVALID_ROLE' 
      }, { status: 400 });
    }

    // Verify project exists
    const project = await db.select()
      .from(projects)
      .where(eq(projects.id, parseInt(projectId.toString())))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND' 
      }, { status: 400 });
    }

    // Verify user exists
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 400 });
    }

    // Check if member already exists
    const existingMember = await db.select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, parseInt(projectId.toString())),
          eq(projectMembers.userId, userId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json({ 
        error: 'User is already a member of this project',
        code: 'DUPLICATE_MEMBER' 
      }, { status: 400 });
    }

    // Create new project member
    const newMember = await db.insert(projectMembers)
      .values({
        projectId: parseInt(projectId.toString()),
        userId,
        role,
        joinedAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newMember[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}