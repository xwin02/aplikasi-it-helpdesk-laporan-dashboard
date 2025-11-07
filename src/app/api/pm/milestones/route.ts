import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { milestones, projects } from '@/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
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

    // Validate projectId is valid integer
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

    // Fetch all milestones for the project, ordered by order ASC, then dueDate ASC
    const projectMilestones = await db.select()
      .from(milestones)
      .where(eq(milestones.projectId, parsedProjectId))
      .orderBy(asc(milestones.order), asc(milestones.dueDate));

    return NextResponse.json(projectMilestones, { status: 200 });
  } catch (error) {
    console.error('GET milestones error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, description, dueDate, completed, order } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json({ 
        error: 'Project ID is required',
        code: 'MISSING_PROJECT_ID' 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Title is required and must be a non-empty string',
        code: 'INVALID_TITLE' 
      }, { status: 400 });
    }

    if (title.trim().length > 255) {
      return NextResponse.json({ 
        error: 'Title must not exceed 255 characters',
        code: 'TITLE_TOO_LONG' 
      }, { status: 400 });
    }

    if (!dueDate) {
      return NextResponse.json({ 
        error: 'Due date is required',
        code: 'MISSING_DUE_DATE' 
      }, { status: 400 });
    }

    // Validate projectId is valid integer
    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      return NextResponse.json({ 
        error: 'Valid project ID is required',
        code: 'INVALID_PROJECT_ID' 
      }, { status: 400 });
    }

    // Validate dueDate is valid ISO date string
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json({ 
        error: 'Due date must be a valid ISO date string',
        code: 'INVALID_DUE_DATE' 
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
      }, { status: 400 });
    }

    // Prepare milestone data
    const now = new Date().toISOString();
    const milestoneData = {
      projectId: parsedProjectId,
      title: title.trim(),
      description: description && typeof description === 'string' ? description.trim() : null,
      dueDate: dueDate,
      completed: typeof completed === 'boolean' ? completed : false,
      order: typeof order === 'number' ? order : 0,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    // Insert milestone
    const newMilestone = await db.insert(milestones)
      .values(milestoneData)
      .returning();

    return NextResponse.json(newMilestone[0], { status: 201 });
  } catch (error) {
    console.error('POST milestone error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}