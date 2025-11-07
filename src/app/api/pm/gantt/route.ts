import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { tasks, projects } from '@/db/schema';
import { eq, and, asc, isNotNull } from 'drizzle-orm';
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Validate projectId is provided
    if (!projectId) {
      return NextResponse.json({ 
        error: 'Project ID is required',
        code: 'MISSING_PROJECT_ID' 
      }, { status: 400 });
    }

    // Validate projectId is a valid integer
    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      return NextResponse.json({ 
        error: 'Valid project ID is required',
        code: 'INVALID_PROJECT_ID' 
      }, { status: 400 });
    }

    // Verify project exists
    const project = await db.select()
      .from(projects)
      .where(eq(projects.id, parsedProjectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Fetch tasks with date ranges for Gantt chart
    const ganttTasks = await db.select({
      id: tasks.id,
      projectId: tasks.projectId,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      assignedTo: tasks.assignedTo,
      startDate: tasks.startDate,
      dueDate: tasks.dueDate,
      progress: tasks.progress,
      order: tasks.order,
      projectTitle: projects.title,
    })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(tasks.projectId, parsedProjectId),
          isNotNull(tasks.startDate),
          isNotNull(tasks.dueDate)
        )
      )
      .orderBy(asc(tasks.order), asc(tasks.startDate));

    return NextResponse.json(ganttTasks, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}