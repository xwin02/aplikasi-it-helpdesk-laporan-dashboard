import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, projects } from '@/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Filter parameters
    const statusFilter = searchParams.get('status');
    const priorityFilter = searchParams.get('priority');

    // Build WHERE conditions
    const conditions = [eq(tasks.assignedTo, session.user.id)];
    
    if (statusFilter) {
      conditions.push(eq(tasks.status, statusFilter));
    }
    
    if (priorityFilter) {
      conditions.push(eq(tasks.priority, priorityFilter));
    }

    // Execute query with join to projects table
    const results = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        assignedTo: tasks.assignedTo,
        createdBy: tasks.createdBy,
        startDate: tasks.startDate,
        dueDate: tasks.dueDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        progress: tasks.progress,
        order: tasks.order,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        completedAt: tasks.completedAt,
        projectTitle: projects.title,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(
        sql`CASE WHEN ${tasks.dueDate} IS NULL THEN 1 ELSE 0 END`,
        asc(tasks.dueDate),
        sql`CASE 
          WHEN ${tasks.priority} = 'urgent' THEN 1
          WHEN ${tasks.priority} = 'high' THEN 2
          WHEN ${tasks.priority} = 'medium' THEN 3
          WHEN ${tasks.priority} = 'low' THEN 4
          ELSE 5
        END`
      )
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET tasks error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}