import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { taskActivities, tasks, projects, user } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate pagination parameters
    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return NextResponse.json({ 
        error: 'Invalid pagination parameters',
        code: 'INVALID_PAGINATION' 
      }, { status: 400 });
    }

    // Fetch recent activities from projects created by the authenticated user
    // Using subquery to join through tasks and projects
    const activities = await db
      .select({
        id: taskActivities.id,
        taskId: taskActivities.taskId,
        userId: taskActivities.userId,
        action: taskActivities.action,
        details: taskActivities.details,
        createdAt: taskActivities.createdAt,
        userName: user.name,
        userEmail: user.email,
        taskTitle: tasks.title,
        projectId: projects.id,
        projectTitle: projects.title,
      })
      .from(taskActivities)
      .innerJoin(tasks, eq(taskActivities.taskId, tasks.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(user, eq(taskActivities.userId, user.id))
      .where(eq(projects.createdBy, session.user.id))
      .orderBy(desc(taskActivities.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(activities, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}