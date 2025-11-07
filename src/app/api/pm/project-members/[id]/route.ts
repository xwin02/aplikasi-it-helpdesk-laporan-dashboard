import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projectMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const VALID_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get and validate ID parameter
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid member ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const memberId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { role } = body;

    // Validate required field
    if (!role) {
      return NextResponse.json(
        { error: 'Role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    // Validate role is valid
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: `Role must be one of: ${VALID_ROLES.join(', ')}`,
          code: 'INVALID_ROLE',
        },
        { status: 400 }
      );
    }

    // Check if member exists
    const existingMember = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.id, memberId))
      .limit(1);

    if (existingMember.length === 0) {
      return NextResponse.json(
        { error: 'Project member not found', code: 'MEMBER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update member role
    const updatedMember = await db
      .update(projectMembers)
      .set({ role })
      .where(eq(projectMembers.id, memberId))
      .returning();

    if (updatedMember.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update project member', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedMember[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get and validate ID parameter
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid member ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const memberId = parseInt(id);

    // Check if member exists
    const existingMember = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.id, memberId))
      .limit(1);

    if (existingMember.length === 0) {
      return NextResponse.json(
        { error: 'Project member not found', code: 'MEMBER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete project member
    const deletedMember = await db
      .delete(projectMembers)
      .where(eq(projectMembers.id, memberId))
      .returning();

    if (deletedMember.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete project member', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Project member removed successfully',
        deletedMember: deletedMember[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}