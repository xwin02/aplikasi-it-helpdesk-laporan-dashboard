import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subtasks } from '@/db/schema';
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

    // Get and validate ID from params
    const { id } = await params;
    const subtaskId = parseInt(id);
    
    if (!id || isNaN(subtaskId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

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

    // Parse request body
    const body = await request.json();
    const { title, completed, order } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string') {
        return NextResponse.json(
          { error: 'Title must be a string', code: 'INVALID_TITLE_TYPE' },
          { status: 400 }
        );
      }

      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        return NextResponse.json(
          { error: 'Title cannot be empty', code: 'EMPTY_TITLE' },
          { status: 400 }
        );
      }

      if (trimmedTitle.length > 255) {
        return NextResponse.json(
          { error: 'Title cannot exceed 255 characters', code: 'TITLE_TOO_LONG' },
          { status: 400 }
        );
      }
    }

    // Validate completed if provided
    if (completed !== undefined && typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Completed must be a boolean', code: 'INVALID_COMPLETED_TYPE' },
        { status: 400 }
      );
    }

    // Validate order if provided
    if (order !== undefined) {
      if (typeof order !== 'number' || !Number.isInteger(order)) {
        return NextResponse.json(
          { error: 'Order must be an integer', code: 'INVALID_ORDER_TYPE' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (completed !== undefined) {
      updateData.completed = completed;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    // Update subtask
    const updatedSubtask = await db
      .update(subtasks)
      .set(updateData)
      .where(eq(subtasks.id, subtaskId))
      .returning();

    return NextResponse.json(updatedSubtask[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
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

    // Get and validate ID from params
    const { id } = await params;
    const subtaskId = parseInt(id);
    
    if (!id || isNaN(subtaskId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

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

    // Delete subtask
    const deletedSubtask = await db
      .delete(subtasks)
      .where(eq(subtasks.id, subtaskId))
      .returning();

    return NextResponse.json(
      {
        message: 'Subtask deleted successfully',
        subtask: deletedSubtask[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}