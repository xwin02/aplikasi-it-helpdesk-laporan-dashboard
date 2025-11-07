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
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get and validate ID parameter
    const { id } = await params;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const milestoneId = parseInt(id);

    // Check if milestone exists
    const existingMilestone = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, milestoneId))
      .limit(1);

    if (existingMilestone.length === 0) {
      return NextResponse.json(
        { error: 'Milestone not found', code: 'MILESTONE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentMilestone = existingMilestone[0];

    // Toggle completion status
    const newCompleted = !currentMilestone.completed;
    
    // Determine completedAt value
    let completedAt: string | null = null;
    if (newCompleted && currentMilestone.completedAt === null) {
      completedAt = new Date().toISOString();
    } else if (!newCompleted) {
      completedAt = null;
    } else {
      // If newCompleted is true but completedAt already exists, preserve it
      completedAt = currentMilestone.completedAt;
    }

    // Update milestone
    const updated = await db
      .update(milestones)
      .set({
        completed: newCompleted,
        completedAt: completedAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(milestones.id, milestoneId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}