import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { taskComments, taskActivities, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, content } = body;

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!taskId) {
      return NextResponse.json({ 
        error: "Task ID is required",
        code: "MISSING_TASK_ID" 
      }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ 
        error: "Content is required",
        code: "MISSING_CONTENT" 
      }, { status: 400 });
    }

    // Validate taskId is a valid integer
    const parsedTaskId = parseInt(taskId);
    if (isNaN(parsedTaskId)) {
      return NextResponse.json({ 
        error: "Task ID must be a valid integer",
        code: "INVALID_TASK_ID" 
      }, { status: 400 });
    }

    // Validate content is not empty after trimming
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json({ 
        error: "Content cannot be empty",
        code: "EMPTY_CONTENT" 
      }, { status: 400 });
    }

    // Validate content length
    if (trimmedContent.length > 5000) {
      return NextResponse.json({ 
        error: "Content must not exceed 5000 characters",
        code: "CONTENT_TOO_LONG" 
      }, { status: 400 });
    }

    // Verify task exists
    const existingTask = await db.select()
      .from(tasks)
      .where(eq(tasks.id, parsedTaskId))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ 
        error: "Task not found",
        code: "TASK_NOT_FOUND" 
      }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // Create comment record
    const newComment = await db.insert(taskComments)
      .values({
        taskId: parsedTaskId,
        userId: session.user.id,
        content: trimmedContent,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    if (newComment.length === 0) {
      return NextResponse.json({ 
        error: "Failed to create comment",
        code: "COMMENT_CREATION_FAILED" 
      }, { status: 500 });
    }

    // Create activity record
    await db.insert(taskActivities)
      .values({
        taskId: parsedTaskId,
        userId: session.user.id,
        action: 'commented',
        details: JSON.stringify({ commentId: newComment[0].id }),
        createdAt: timestamp
      });

    return NextResponse.json(newComment[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}