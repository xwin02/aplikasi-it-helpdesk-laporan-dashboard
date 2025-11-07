import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq, and, sql, lt } from 'drizzle-orm';
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

    const userId = session.user.id;
    const currentDate = new Date().toISOString();

    // Calculate totalProjects - projects created by user
    const totalProjectsResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(projects)
    .where(eq(projects.createdBy, userId));
    const totalProjects = Number(totalProjectsResult[0]?.count || 0);

    // Calculate totalTasks - all tasks across all projects
    const totalTasksResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(tasks);
    const totalTasks = Number(totalTasksResult[0]?.count || 0);

    // Calculate assignedToMe - tasks assigned to user
    const assignedToMeResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(tasks)
    .where(eq(tasks.assignedTo, userId));
    const assignedToMe = Number(assignedToMeResult[0]?.count || 0);

    // Calculate overdueTasks - tasks assigned to user that are overdue and not completed
    const overdueTasksResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.assignedTo, userId),
        lt(tasks.dueDate, currentDate),
        sql`${tasks.status} != 'completed'`
      )
    );
    const overdueTasks = Number(overdueTasksResult[0]?.count || 0);

    // Calculate myProjects - same as totalProjects
    const myProjects = totalProjects;

    // Calculate activeProjects - projects created by user with status 'todo' or 'in_progress'
    const activeProjectsResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(projects)
    .where(
      and(
        eq(projects.createdBy, userId),
        sql`${projects.status} IN ('todo', 'in_progress')`
      )
    );
    const activeProjects = Number(activeProjectsResult[0]?.count || 0);

    // Calculate completedTasks - tasks assigned to user with status 'completed'
    const completedTasksResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.assignedTo, userId),
        eq(tasks.status, 'completed')
      )
    );
    const completedTasks = Number(completedTasksResult[0]?.count || 0);

    // Calculate inProgressTasks - tasks assigned to user with status 'in_progress'
    const inProgressTasksResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.assignedTo, userId),
        eq(tasks.status, 'in_progress')
      )
    );
    const inProgressTasks = Number(inProgressTasksResult[0]?.count || 0);

    // Return dashboard statistics
    return NextResponse.json({
      totalProjects,
      totalTasks,
      assignedToMe,
      overdueTasks,
      myProjects,
      activeProjects,
      completedTasks,
      inProgressTasks
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}