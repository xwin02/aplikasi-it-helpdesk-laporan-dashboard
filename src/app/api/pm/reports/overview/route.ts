import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, projects, projectMembers } from '@/db/schema';
import { eq, and, or, gte, lte, lt, sql } from 'drizzle-orm';
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
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate date parameters
    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json({
        error: 'Invalid startDate format. Use ISO date format.',
        code: 'INVALID_START_DATE'
      }, { status: 400 });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json({
        error: 'Invalid endDate format. Use ISO date format.',
        code: 'INVALID_END_DATE'
      }, { status: 400 });
    }

    // If projectId provided, validate and check access
    if (projectId) {
      const projectIdNum = parseInt(projectId);
      if (isNaN(projectIdNum)) {
        return NextResponse.json({
          error: 'Invalid projectId. Must be a valid integer.',
          code: 'INVALID_PROJECT_ID'
        }, { status: 400 });
      }

      // Check if project exists
      const project = await db.select()
        .from(projects)
        .where(eq(projects.id, projectIdNum))
        .limit(1);

      if (project.length === 0) {
        return NextResponse.json({
          error: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        }, { status: 404 });
      }

      // Check if user has access (is creator or is a member)
      const isCreator = project[0].createdBy === session.user.id;
      
      const membership = await db.select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectIdNum),
            eq(projectMembers.userId, session.user.id)
          )
        )
        .limit(1);

      const isMember = membership.length > 0;

      if (!isCreator && !isMember) {
        return NextResponse.json({
          error: 'Access denied. You do not have permission to view this project.',
          code: 'ACCESS_DENIED'
        }, { status: 403 });
      }
    }

    // Build filter conditions for tasks
    const filterConditions = [];
    
    if (projectId) {
      filterConditions.push(eq(tasks.projectId, parseInt(projectId)));
    }
    
    if (startDate) {
      filterConditions.push(gte(tasks.createdAt, startDate));
    }
    
    if (endDate) {
      filterConditions.push(lte(tasks.createdAt, endDate));
    }

    const whereClause = filterConditions.length > 0 
      ? and(...filterConditions) 
      : undefined;

    // Fetch all tasks with filters
    const allTasks = whereClause
      ? await db.select().from(tasks).where(whereClause)
      : await db.select().from(tasks);

    // Calculate total tasks
    const totalTasks = allTasks.length;

    // Calculate tasks by status
    const tasksByStatus = {
      todo: allTasks.filter(t => t.status === 'todo').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      review: allTasks.filter(t => t.status === 'review').length,
      completed: allTasks.filter(t => t.status === 'completed').length
    };

    // Calculate tasks by priority
    const tasksByPriority = {
      low: allTasks.filter(t => t.priority === 'low').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      high: allTasks.filter(t => t.priority === 'high').length,
      urgent: allTasks.filter(t => t.priority === 'urgent').length
    };

    // Calculate completion rate
    const completedCount = tasksByStatus.completed;
    const completionRate = totalTasks > 0 
      ? parseFloat((completedCount / totalTasks * 100).toFixed(2))
      : 0;

    // Calculate overdue tasks
    const currentDate = new Date().toISOString();
    const overdueTasks = allTasks.filter(t => 
      t.dueDate && 
      t.dueDate < currentDate && 
      t.status !== 'completed'
    ).length;

    // Calculate total estimated hours
    const totalEstimatedHours = allTasks.reduce((sum, t) => 
      sum + (t.estimatedHours || 0), 0
    );

    // Calculate total actual hours
    const totalActualHours = allTasks.reduce((sum, t) => 
      sum + (t.actualHours || 0), 0
    );

    // Calculate average progress
    const tasksWithProgress = allTasks.filter(t => t.progress !== null);
    const averageProgress = tasksWithProgress.length > 0
      ? parseFloat((tasksWithProgress.reduce((sum, t) => sum + (t.progress || 0), 0) / tasksWithProgress.length).toFixed(2))
      : 0;

    // Calculate member count (only if projectId is provided)
    let memberCount = 0;
    if (projectId) {
      const members = await db.select()
        .from(projectMembers)
        .where(eq(projectMembers.projectId, parseInt(projectId)));
      memberCount = members.length;
    }

    // Calculate task completion trend
    const completedTasks = allTasks.filter(t => 
      t.status === 'completed' && t.completedAt
    );

    const trendMap = new Map<string, number>();
    completedTasks.forEach(t => {
      if (t.completedAt) {
        const date = t.completedAt.split('T')[0];
        trendMap.set(date, (trendMap.get(date) || 0) + 1);
      }
    });

    const taskCompletionTrend = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Build response
    const analytics = {
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      completionRate,
      overdueTasks,
      totalEstimatedHours,
      totalActualHours,
      averageProgress,
      memberCount,
      taskCompletionTrend
    };

    return NextResponse.json(analytics, { status: 200 });

  } catch (error) {
    console.error('GET analytics error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}