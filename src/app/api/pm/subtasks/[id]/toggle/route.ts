import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { subtasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

    // Get and validate ID from params
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const subtaskId = parseInt(id);

    // Check if subtask exists
    const existingSubtask = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.id, subtaskId))
      .limit(1);

    if (existingSubtask.length === 0) {
      return NextResponse.json(
        { error: 'Subtask not found', code: 'SUBTASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentSubtask = existingSubtask[0];

    // Toggle completed status
    const newCompleted = !currentSubtask.completed;

    // Update subtask with toggled status
    const updated = await db
      .update(subtasks)
      .set({
        completed: newCompleted,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(subtasks.id, subtaskId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update subtask', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT subtask error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}