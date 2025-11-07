import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

const VALID_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single project by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const project = await db.select()
        .from(projects)
        .where(eq(projects.id, parseInt(id)))
        .limit(1);

      if (project.length === 0) {
        return NextResponse.json({ 
          error: 'Project not found',
          code: 'PROJECT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(project[0], { status: 200 });
    }

    // List projects with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const createdBy = searchParams.get('createdBy');

    // Validate filter values
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        code: 'INVALID_PRIORITY' 
      }, { status: 400 });
    }

    // Build query with filters
    let query = db.select().from(projects);
    const conditions = [];

    if (status) {
      conditions.push(eq(projects.status, status));
    }

    if (priority) {
      conditions.push(eq(projects.priority, priority));
    }

    if (assignedTo) {
      conditions.push(eq(projects.assignedTo, assignedTo));
    }

    if (createdBy) {
      conditions.push(eq(projects.createdBy, createdBy));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, priority, assignedTo, createdBy, dueDate } = body;

    // Validate required fields
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

    if (!createdBy || typeof createdBy !== 'string' || createdBy.trim().length === 0) {
      return NextResponse.json({ 
        error: 'createdBy is required and must be a valid user ID',
        code: 'MISSING_CREATED_BY' 
      }, { status: 400 });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate priority if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
        code: 'INVALID_PRIORITY' 
      }, { status: 400 });
    }

    // Validate assignedTo if provided
    if (assignedTo !== undefined && assignedTo !== null && (typeof assignedTo !== 'string' || assignedTo.trim().length === 0)) {
      return NextResponse.json({ 
        error: 'assignedTo must be a valid user ID string',
        code: 'INVALID_ASSIGNED_TO' 
      }, { status: 400 });
    }

    // Validate dueDate if provided
    if (dueDate !== undefined && dueDate !== null) {
      if (typeof dueDate !== 'string' || !isValidDate(dueDate)) {
        return NextResponse.json({ 
          error: 'dueDate must be a valid ISO date string',
          code: 'INVALID_DUE_DATE' 
        }, { status: 400 });
      }
    }

    // Prepare insert data with defaults and sanitization
    const insertData: any = {
      title: title.trim(),
      description: description ? description.trim() : null,
      status: status || 'backlog',
      priority: priority || 'medium',
      assignedTo: assignedTo ? assignedTo.trim() : null,
      createdBy: createdBy.trim(),
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newProject = await db.insert(projects)
      .values(insertData)
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();

    // Check if project exists
    const existingProject = await db.select()
      .from(projects)
      .where(eq(projects.id, parseInt(id)))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND' 
      }, { status: 404 });
    }

    const { title, description, status, priority, assignedTo, createdBy, dueDate } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ 
          error: 'Title cannot be empty',
          code: 'INVALID_TITLE' 
        }, { status: 400 });
      }

      if (title.trim().length > 255) {
        return NextResponse.json({ 
          error: 'Title cannot exceed 255 characters',
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

    // Validate assignedTo if provided
    if (assignedTo !== undefined && assignedTo !== null && (typeof assignedTo !== 'string' || assignedTo.trim().length === 0)) {
      return NextResponse.json({ 
        error: 'assignedTo must be a valid user ID string or null',
        code: 'INVALID_ASSIGNED_TO' 
      }, { status: 400 });
    }

    // Validate createdBy if provided
    if (createdBy !== undefined && (typeof createdBy !== 'string' || createdBy.trim().length === 0)) {
      return NextResponse.json({ 
        error: 'createdBy must be a valid user ID string',
        code: 'INVALID_CREATED_BY' 
      }, { status: 400 });
    }

    // Validate dueDate if provided
    if (dueDate !== undefined && dueDate !== null) {
      if (typeof dueDate !== 'string' || !isValidDate(dueDate)) {
        return NextResponse.json({ 
          error: 'dueDate must be a valid ISO date string or null',
          code: 'INVALID_DUE_DATE' 
        }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo ? assignedTo.trim() : null;
    if (createdBy !== undefined) updates.createdBy = createdBy.trim();
    if (dueDate !== undefined) updates.dueDate = dueDate;

    const updated = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if project exists
    const existingProject = await db.select()
      .from(projects)
      .where(eq(projects.id, parseInt(id)))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(projects)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Project deleted successfully',
      project: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}