import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { projects, projectMembers, milestones, tasks, user } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

const VALID_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required', 
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const projectId = parseInt(id);

    // Fetch the project
    const project = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found', 
        code: 'PROJECT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Fetch project members with user details
    const members = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: projectMembers.role,
    })
      .from(projectMembers)
      .innerJoin(user, eq(projectMembers.userId, user.id))
      .where(eq(projectMembers.projectId, projectId));

    // Fetch milestones ordered by order ASC
    const projectMilestones = await db.select()
      .from(milestones)
      .where(eq(milestones.projectId, projectId))
      .orderBy(milestones.order);

    // Fetch task statistics
    const taskStatsResult = await db.select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${tasks.status} = 'done' then 1 else 0 end)`,
      in_progress: sql<number>`sum(case when ${tasks.status} = 'in_progress' then 1 else 0 end)`,
      todo: sql<number>`sum(case when ${tasks.status} = 'todo' then 1 else 0 end)`,
    })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    const taskStats = {
      total: Number(taskStatsResult[0]?.total || 0),
      completed: Number(taskStatsResult[0]?.completed || 0),
      in_progress: Number(taskStatsResult[0]?.in_progress || 0),
      todo: Number(taskStatsResult[0]?.todo || 0),
    };

    return NextResponse.json({
      ...project[0],
      members,
      milestones: projectMilestones,
      taskStats,
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required', 
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const projectId = parseInt(id);

    // Check if project exists
    const existingProject = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found', 
        code: 'PROJECT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, status, priority, assignedTo, dueDate } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ 
          error: 'Title cannot be empty', 
          code: 'INVALID_TITLE' 
        }, { status: 400 });
      }
      if (title.length > 255) {
        return NextResponse.json({ 
          error: 'Title must be 255 characters or less', 
          code: 'TITLE_TOO_LONG' 
        }, { status: 400 });
      }
    }

    // Validate status if provided
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate priority if provided
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`, 
        code: 'INVALID_PRIORITY' 
      }, { status: 400 });
    }

    // Validate dueDate if provided
    if (dueDate !== undefined) {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid due date format. Must be a valid ISO date string', 
          code: 'INVALID_DUE_DATE' 
        }, { status: 400 });
      }
    }

    // Build update object
    const updates: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    // Update the project
    const updated = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required', 
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const projectId = parseInt(id);

    // Check if project exists
    const existingProject = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found', 
        code: 'PROJECT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the project (cascade will delete related records)
    const deleted = await db.delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({
      message: 'Project deleted successfully',
      project: deleted[0],
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}