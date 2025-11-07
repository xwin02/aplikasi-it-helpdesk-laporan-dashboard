import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, subtasks, taskComments, taskAttachments, projects } from '@/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'completed'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');

    let conditions = [];

    if (projectId) {
      const projectIdNum = parseInt(projectId);
      if (isNaN(projectIdNum)) {
        return NextResponse.json({ 
          error: 'Invalid project ID',
          code: 'INVALID_PROJECT_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(tasks.projectId, projectIdNum));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      conditions.push(eq(tasks.status, status));
    }

    if (priority) {
      if (!VALID_PRIORITIES.includes(priority as any)) {
        return NextResponse.json({ 
          error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
          code: 'INVALID_PRIORITY' 
        }, { status: 400 });
      }
      conditions.push(eq(tasks.priority, priority));
    }

    if (assignedTo) {
      conditions.push(eq(tasks.assignedTo, assignedTo));
    }

    let query = db.select().from(tasks);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const taskResults = await query
      .orderBy(asc(tasks.order), desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    const tasksWithCounts = await Promise.all(
      taskResults.map(async (task) => {
        const subtaskCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(subtasks)
          .where(eq(subtasks.taskId, task.id));

        const commentCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(taskComments)
          .where(eq(taskComments.taskId, task.id));

        const attachmentCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(taskAttachments)
          .where(eq(taskAttachments.taskId, task.id));

        return {
          ...task,
          subtaskCount: Number(subtaskCountResult[0]?.count ?? 0),
          commentCount: Number(commentCountResult[0]?.count ?? 0),
          attachmentCount: Number(attachmentCountResult[0]?.count ?? 0),
        };
      })
    );

    return NextResponse.json(tasksWithCounts, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body || 'createdBy' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { 
      projectId, 
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
      order 
    } = body;

    if (!projectId || typeof projectId !== 'number') {
      return NextResponse.json({ 
        error: 'Project ID is required and must be a number',
        code: 'MISSING_PROJECT_ID' 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Title is required and cannot be empty',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (title.trim().length > 255) {
      return NextResponse.json({ 
        error: 'Title cannot exceed 255 characters',
        code: 'TITLE_TOO_LONG' 
      }, { status: 400 });
    }

    if (status && !VALID_STATUSES.includes(status as any)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    if (priority && !VALID_PRIORITIES.includes(priority as any)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        code: 'INVALID_PRIORITY' 
      }, { status: 400 });
    }

    if (startDate) {
      const startDateObj = new Date(startDate);
      if (isNaN(startDateObj.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid start date format. Must be a valid ISO date string',
          code: 'INVALID_START_DATE' 
        }, { status: 400 });
      }
    }

    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid due date format. Must be a valid ISO date string',
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
          error: 'Progress must be a number between 0 and 100',
          code: 'INVALID_PROGRESS' 
        }, { status: 400 });
      }
    }

    const projectExists = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (projectExists.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND' 
      }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    const insertData: any = {
      projectId,
      title: title.trim(),
      createdBy: session.user.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (description !== undefined) insertData.description = description;
    if (status !== undefined) insertData.status = status;
    if (priority !== undefined) insertData.priority = priority;
    if (assignedTo !== undefined) insertData.assignedTo = assignedTo;
    if (startDate !== undefined) insertData.startDate = startDate;
    if (dueDate !== undefined) insertData.dueDate = dueDate;
    if (estimatedHours !== undefined) insertData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) insertData.actualHours = actualHours;
    if (progress !== undefined) insertData.progress = progress;
    if (order !== undefined) insertData.order = order;

    const newTask = await db.insert(tasks)
      .values(insertData)
      .returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}