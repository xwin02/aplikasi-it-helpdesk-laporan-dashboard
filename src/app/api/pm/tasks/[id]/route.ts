import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { tasks, subtasks, taskComments, taskAttachments, taskActivities, user } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const taskId = parseInt(id);

    // Fetch task
    const taskResult = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (taskResult.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult[0];

    // Fetch subtasks
    const subtasksList = await db.select()
      .from(subtasks)
      .where(eq(subtasks.taskId, taskId))
      .orderBy(asc(subtasks.order));

    // Fetch comments with user info
    const commentsList = await db.select({
      id: taskComments.id,
      userId: taskComments.userId,
      userName: user.name,
      userEmail: user.email,
      content: taskComments.content,
      createdAt: taskComments.createdAt,
      updatedAt: taskComments.updatedAt,
    })
      .from(taskComments)
      .leftJoin(user, eq(taskComments.userId, user.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(desc(taskComments.createdAt));

    // Fetch attachments with uploader info
    const attachmentsList = await db.select({
      id: taskAttachments.id,
      taskId: taskAttachments.taskId,
      fileName: taskAttachments.fileName,
      fileUrl: taskAttachments.fileUrl,
      fileSize: taskAttachments.fileSize,
      fileType: taskAttachments.fileType,
      uploadedBy: taskAttachments.uploadedBy,
      uploaderName: user.name,
      uploaderEmail: user.email,
      createdAt: taskAttachments.createdAt,
    })
      .from(taskAttachments)
      .leftJoin(user, eq(taskAttachments.uploadedBy, user.id))
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.createdAt));

    // Fetch activities with user info (limit 50)
    const activitiesList = await db.select({
      id: taskActivities.id,
      userId: taskActivities.userId,
      userName: user.name,
      action: taskActivities.action,
      details: taskActivities.details,
      createdAt: taskActivities.createdAt,
    })
      .from(taskActivities)
      .leftJoin(user, eq(taskActivities.userId, user.id))
      .where(eq(taskActivities.taskId, taskId))
      .orderBy(desc(taskActivities.createdAt))
      .limit(50);

    // Construct full task object
    const fullTask = {
      ...task,
      subtasks: subtasksList,
      comments: commentsList,
      attachments: attachmentsList,
      activities: activitiesList,
    };

    return NextResponse.json(fullTask, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const taskId = parseInt(id);

    // Check if task exists
    const existingTask = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      startDate,
      dueDate,
      estimatedHours,
      actualHours,
      progress,
      order,
    } = body;

    // Validation
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ 
          error: 'Title cannot be empty',
          code: 'INVALID_TITLE' 
        }, { status: 400 });
      }
      if (title.length > 255) {
        return NextResponse.json({ 
          error: 'Title cannot exceed 255 characters',
          code: 'TITLE_TOO_LONG' 
        }, { status: 400 });
      }
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ 
        error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
        code: 'INVALID_PRIORITY' 
      }, { status: 400 });
    }

    if (startDate !== undefined && startDate !== null) {
      const parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json({ 
          error: 'Start date must be a valid ISO date string',
          code: 'INVALID_START_DATE' 
        }, { status: 400 });
      }
    }

    if (dueDate !== undefined && dueDate !== null) {
      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json({ 
          error: 'Due date must be a valid ISO date string',
          code: 'INVALID_DUE_DATE' 
        }, { status: 400 });
      }
    }

    if (estimatedHours !== undefined && estimatedHours !== null) {
      if (typeof estimatedHours !== 'number' || estimatedHours < 0) {
        return NextResponse.json({ 
          error: 'Estimated hours must be a non-negative number',
          code: 'INVALID_ESTIMATED_HOURS' 
        }, { status: 400 });
      }
    }

    if (actualHours !== undefined && actualHours !== null) {
      if (typeof actualHours !== 'number' || actualHours < 0) {
        return NextResponse.json({ 
          error: 'Actual hours must be a non-negative number',
          code: 'INVALID_ACTUAL_HOURS' 
        }, { status: 400 });
      }
    }

    if (progress !== undefined && progress !== null) {
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return NextResponse.json({ 
          error: 'Progress must be between 0 and 100',
          code: 'INVALID_PROGRESS' 
        }, { status: 400 });
      }
    }

    // Build update object
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (startDate !== undefined) updates.startDate = startDate;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (estimatedHours !== undefined) updates.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updates.actualHours = actualHours;
    if (progress !== undefined) updates.progress = progress;
    if (order !== undefined) updates.order = order;

    // If status changes to completed and completedAt is null, set completedAt
    if (status === 'completed' && existingTask[0].completedAt === null) {
      updates.completedAt = new Date().toISOString();
    }

    // Update task
    const updatedTask = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId))
      .returning();

    return NextResponse.json(updatedTask[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const taskId = parseInt(id);

    // Check if task exists
    const existingTask = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete task (cascade will delete related records)
    const deleted = await db.delete(tasks)
      .where(eq(tasks.id, taskId))
      .returning();

    return NextResponse.json({
      message: 'Task deleted successfully',
      task: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}