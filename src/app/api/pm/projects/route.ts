import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, projectMembers, tasks } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const VALID_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const statusFilter = searchParams.get('status');
    const priorityFilter = searchParams.get('priority');

    let query = db.select().from(projects);

    const conditions = [];
    if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
      conditions.push(eq(projects.status, statusFilter));
    }
    if (priorityFilter && VALID_PRIORITIES.includes(priorityFilter)) {
      conditions.push(eq(projects.priority, priorityFilter));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const projectsList = await query
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    const enrichedProjects = await Promise.all(
      projectsList.map(async (project) => {
        const memberCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, project.id));
        
        const memberCount = memberCountResult[0]?.count || 0;

        const totalTasksResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(eq(tasks.projectId, project.id));
        
        const completedTasksResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(eq(tasks.projectId, project.id), eq(tasks.status, 'done')));
        
        const inProgressTasksResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(eq(tasks.projectId, project.id), eq(tasks.status, 'in_progress')));
        
        const todoTasksResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(eq(tasks.projectId, project.id), eq(tasks.status, 'todo')));

        const taskStats = {
          total: totalTasksResult[0]?.count || 0,
          completed: completedTasksResult[0]?.count || 0,
          in_progress: inProgressTasksResult[0]?.count || 0,
          todo: todoTasksResult[0]?.count || 0
        };

        return {
          ...project,
          memberCount,
          taskStats
        };
      })
    );

    return NextResponse.json(enrichedProjects, { status: 200 });
  } catch (error) {
    console.error('GET projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, assignedTo, dueDate } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: 'Title must not exceed 255 characters', code: 'TITLE_TOO_LONG' },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { 
          error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`, 
          code: 'INVALID_PRIORITY' 
        },
        { status: 400 }
      );
    }

    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid dueDate format. Must be a valid ISO date string', code: 'INVALID_DUE_DATE' },
          { status: 400 }
        );
      }
    }

    const timestamp = new Date().toISOString();

    const newProject = await db.insert(projects)
      .values({
        title: title.trim(),
        description: description ? description.trim() : null,
        status: status || 'backlog',
        priority: priority || 'medium',
        assignedTo: assignedTo || null,
        createdBy: session.user.id,
        dueDate: dueDate || null,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error('POST projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}