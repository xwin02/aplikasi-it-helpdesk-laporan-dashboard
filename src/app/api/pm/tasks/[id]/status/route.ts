import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, taskActivities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'completed'] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Get and validate ID
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const taskId = parseInt(id);

    // Parse and validate request body
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ 
        error: 'Status is required',
        code: 'MISSING_STATUS' 
      }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Check if task exists and get current status
    const existingTask = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ 
        error: 'Task not found',
        code: 'TASK_NOT_FOUND' 
      }, { status: 404 });
    }

    const oldStatus = existingTask[0].status;
    const currentTimestamp = new Date().toISOString();

    // Prepare update data
    const updateData: {
      status: string;
      updatedAt: string;
      completedAt?: string;
    } = {
      status,
      updatedAt: currentTimestamp,
    };

    // If new status is 'completed' and completedAt is null, set it
    if (status === 'completed' && !existingTask[0].completedAt) {
      updateData.completedAt = currentTimestamp;
    }

    // Update task status
    const updatedTask = await db.update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    // Create activity record
    await db.insert(taskActivities)
      .values({
        taskId,
        userId: session.user.id,
        action: 'status_changed',
        details: JSON.stringify({ from: oldStatus, to: status }),
        createdAt: currentTimestamp,
      });

    return NextResponse.json(updatedTask[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}