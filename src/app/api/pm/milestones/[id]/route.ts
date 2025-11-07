import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { milestones } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

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
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const milestoneId = parseInt(id);

    const existingMilestone = await db.select()
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);

    if (existingMilestone.length === 0) {
      return NextResponse.json({ 
        error: 'Milestone not found',
        code: 'MILESTONE_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, dueDate, completed, order } = body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ 
          error: "Title cannot be empty",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      if (title.length > 255) {
        return NextResponse.json({ 
          error: "Title cannot exceed 255 characters",
          code: "TITLE_TOO_LONG" 
        }, { status: 400 });
      }
    }

    if (dueDate !== undefined && dueDate !== null) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      if (!dateRegex.test(dueDate)) {
        return NextResponse.json({ 
          error: "Invalid date format. Use ISO 8601 format",
          code: "INVALID_DATE_FORMAT" 
        }, { status: 400 });
      }
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ 
          error: "Invalid date value",
          code: "INVALID_DATE" 
        }, { status: 400 });
      }
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) {
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (dueDate !== undefined) {
      updates.dueDate = dueDate;
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return NextResponse.json({ 
          error: "Completed must be a boolean",
          code: "INVALID_COMPLETED" 
        }, { status: 400 });
      }
      updates.completed = completed;
      
      if (completed && !existingMilestone[0].completed) {
        updates.completedAt = new Date().toISOString();
      } else if (!completed && existingMilestone[0].completed) {
        updates.completedAt = null;
      }
    }

    if (order !== undefined) {
      if (typeof order !== 'number' || !Number.isInteger(order)) {
        return NextResponse.json({ 
          error: "Order must be an integer",
          code: "INVALID_ORDER" 
        }, { status: 400 });
      }
      updates.order = order;
    }

    const updated = await db.update(milestones)
      .set(updates)
      .where(eq(milestones.id, milestoneId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update milestone',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
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
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const milestoneId = parseInt(id);

    const existingMilestone = await db.select()
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);

    if (existingMilestone.length === 0) {
      return NextResponse.json({ 
        error: 'Milestone not found',
        code: 'MILESTONE_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(milestones)
      .where(eq(milestones.id, milestoneId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete milestone',
        code: 'DELETE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Milestone deleted successfully',
      milestone: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}