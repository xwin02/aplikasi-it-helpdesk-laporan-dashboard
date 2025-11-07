import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, projects } from '@/db/schema';
import { eq, and, or, gte, lte, isNotNull } from 'drizzle-orm';
import { headers } from 'next/headers';
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
    
    // Get and validate month parameter (default to current month)
    const currentDate = new Date();
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    
    const month = monthParam ? parseInt(monthParam) : currentDate.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam) : currentDate.getFullYear();

    // Validate month (1-12)
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ 
        error: 'Month must be between 1 and 12',
        code: 'INVALID_MONTH' 
      }, { status: 400 });
    }

    // Validate year (4-digit number)
    if (isNaN(year) || year < 1000 || year > 9999) {
      return NextResponse.json({ 
        error: 'Year must be a valid 4-digit number',
        code: 'INVALID_YEAR' 
      }, { status: 400 });
    }

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    // Query tasks with project information
    // Tasks where user is assigned OR user created the project
    const allTasks = await db
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
        projectCreatedBy: projects.createdBy,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          isNotNull(tasks.dueDate),
          gte(tasks.dueDate, startDateISO),
          lte(tasks.dueDate, endDateISO),
          or(
            eq(tasks.assignedTo, session.user.id),
            eq(projects.createdBy, session.user.id)
          )
        )
      );

    // Group tasks by dueDate
    const groupedTasks: Record<string, any[]> = {};

    for (const task of allTasks) {
      if (task.dueDate) {
        // Extract date part (YYYY-MM-DD) from ISO string
        const dateKey = task.dueDate.split('T')[0];
        
        if (!groupedTasks[dateKey]) {
          groupedTasks[dateKey] = [];
        }

        // Remove projectCreatedBy from response (used only for filtering)
        const { projectCreatedBy, ...taskWithoutInternalFields } = task;
        
        groupedTasks[dateKey].push(taskWithoutInternalFields);
      }
    }

    return NextResponse.json(groupedTasks, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}