import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { db } from '@/db';
import { taskComments, user } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const allowedRoles = ['superadmin', 'teknisi'];

// GET task comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifySession(token);
    if (!session || !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const comments = await db
      .select({
        id: taskComments.id,
        content: taskComments.content,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        userId: taskComments.userId,
        userName: user.name,
        userEmail: user.email,
      })
      .from(taskComments)
      .leftJoin(user, eq(taskComments.userId, user.id))
      .where(eq(taskComments.taskId, parseInt(id)))
      .orderBy(desc(taskComments.createdAt));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifySession(token);
    if (!session || !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const [newComment] = await db.insert(taskComments).values({
      taskId: parseInt(id),
      userId: session.id,
      content: content.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [commentWithUser] = await db
      .select({
        id: taskComments.id,
        content: taskComments.content,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        userId: taskComments.userId,
        userName: user.name,
        userEmail: user.email,
      })
      .from(taskComments)
      .leftJoin(user, eq(taskComments.userId, user.id))
      .where(eq(taskComments.id, Number(newComment.insertId)))
      .limit(1);

    return NextResponse.json({ success: true, comment: commentWithUser, message: 'Comment added successfully' });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE comment — only superadmin
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifySession(token);
    if (!session || !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.delete(taskComments).where(eq(taskComments.id, parseInt(commentId)));

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
