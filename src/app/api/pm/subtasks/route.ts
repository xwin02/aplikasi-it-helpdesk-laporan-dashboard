import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { subtasks, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication required
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, title, completed, order } = body;

    // Validate required fields
    if (!taskId) {
      return NextResponse.json({ 
        error: 'Task ID is required', 
        code: 'MISSING_TASK_ID' 
      }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ 
        error: 'Title is required', 
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    // Validate taskId is a valid integer
    const parsedTaskId = parseInt(taskId);
    if (isNaN(parsedTaskId)) {
      return NextResponse.json({ 
        error: 'Task ID must be a valid integer', 
        code: 'INVALID_TASK_ID' 
      }, { status: 400 });
    }

    // Validate title is not empty and within length limit
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return NextResponse.json({ 
        error: 'Title cannot be empty', 
        code: 'EMPTY_TITLE' 
      }, { status: 400 });
    }

    if (trimmedTitle.length > 255) {
      return NextResponse.json({ 
        error: 'Title cannot exceed 255 characters', 
        code: 'TITLE_TOO_LONG' 
      }, { status: 400 });
    }

    // Verify taskId exists in tasks table
    const existingTask = await db.select()
      .from(tasks)
      .where(eq(tasks.id, parsedTaskId))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ 
        error: 'Task not found', 
        code: 'TASK_NOT_FOUND' 
      }, { status: 400 });
    }

    // Prepare insert data with defaults
    const now = new Date().toISOString();
    const insertData = {
      taskId: parsedTaskId,
      title: trimmedTitle,
      completed: completed !== undefined ? Boolean(completed) : false,
      order: order !== undefined ? parseInt(order) : 0,
      createdAt: now,
      updatedAt: now,
    };

    // Validate order is a valid integer if provided
    if (order !== undefined && isNaN(insertData.order)) {
      return NextResponse.json({ 
        error: 'Order must be a valid integer', 
        code: 'INVALID_ORDER' 
      }, { status: 400 });
    }

    // Create the subtask
    const newSubtask = await db.insert(subtasks)
      .values(insertData)
      .returning();

    return NextResponse.json(newSubtask[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}