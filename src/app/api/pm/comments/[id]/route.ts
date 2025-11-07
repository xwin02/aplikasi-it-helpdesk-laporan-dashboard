import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { taskComments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID parameter
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid comment ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const commentId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required and cannot be empty', code: 'MISSING_CONTENT' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Content cannot exceed 5000 characters', code: 'CONTENT_TOO_LONG' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const existingComment = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, commentId))
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found', code: 'COMMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization check: Only comment author can update
    if (existingComment[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this comment', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Update comment
    const updatedComment = await db
      .update(taskComments)
      .set({
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(taskComments.id, commentId), eq(taskComments.userId, session.user.id)))
      .returning();

    if (updatedComment.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update comment', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedComment[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
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
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID parameter
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid comment ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const commentId = parseInt(id);

    // Check if comment exists
    const existingComment = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, commentId))
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found', code: 'COMMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization check: Only comment author can delete
    if (existingComment[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this comment', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Delete comment
    const deletedComment = await db
      .delete(taskComments)
      .where(and(eq(taskComments.id, commentId), eq(taskComments.userId, session.user.id)))
      .returning();

    if (deletedComment.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete comment', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Comment deleted successfully',
        comment: deletedComment[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}