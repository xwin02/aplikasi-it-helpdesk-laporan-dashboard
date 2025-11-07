import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
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
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get and validate ID parameter
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const taskId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { progress } = body;

    // Validate progress field
    if (progress === undefined || progress === null) {
      return NextResponse.json(
        { error: 'Progress is required', code: 'MISSING_PROGRESS' },
        { status: 400 }
      );
    }

    // Validate progress is a number
    if (typeof progress !== 'number' || isNaN(progress)) {
      return NextResponse.json(
        { error: 'Progress must be a valid number', code: 'INVALID_PROGRESS_TYPE' },
        { status: 400 }
      );
    }

    // Validate progress is an integer
    if (!Number.isInteger(progress)) {
      return NextResponse.json(
        { error: 'Progress must be an integer', code: 'INVALID_PROGRESS_INTEGER' },
        { status: 400 }
      );
    }

    // Validate progress range (0-100 inclusive)
    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100', code: 'INVALID_PROGRESS_RANGE' },
        { status: 400 }
      );
    }

    // Check if task exists
    const existingTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update task progress
    const updatedTask = await db
      .update(tasks)
      .set({
        progress,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update task', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedTask[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}