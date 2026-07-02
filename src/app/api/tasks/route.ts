import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendTelegramNotification, formatDateWIB } from '@/lib/telegram';

// GET all tasks (optionally filter by projectId)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || (session.role !== 'superadmin' && session.role !== 'teknisi')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let query = db.select().from(tasks);

    if (projectId) {
      query = query.where(eq(tasks.projectId, parseInt(projectId))) as any;
    }

    let allTasks = await query.orderBy(desc(tasks.createdAt));

    // Teknisi only sees tasks assigned to them
    if (session.role === 'teknisi') {
      allTasks = allTasks.filter(task => task.assignedTo === session.id);
    }

    return NextResponse.json({ tasks: allTasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new task
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      projectId,
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      estimatedHours,
    } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      );
    }

    const [newTask] = await db.insert(tasks).values({
      projectId,
      title,
      description: description || null,
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      createdBy: session.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours: estimatedHours || null,
      progress: 0,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send Telegram notification (non-blocking)
    const priorityEmoji: Record<string, string> = {
      low: '🟢', medium: '🟡', high: '🟠', urgent: '🔴',
    };
    const statusEmoji: Record<string, string> = {
      todo: '📋', in_progress: '🔧', in_review: '👀', done: '✅',
    };
    sendTelegramNotification(
      `✅ <b>TASK BARU DIBUAT</b>\n\n` +
      `📌 <b>Judul:</b> ${title}\n` +
      `${priorityEmoji[priority || 'medium']} <b>Prioritas:</b> ${(priority || 'medium').toUpperCase()}\n` +
      `${statusEmoji[status || 'todo']} <b>Status:</b> ${(status || 'todo').replace('_', ' ')}\n` +
      `${assignedTo ? `👤 <b>Assigned To:</b> ${assignedTo}\n` : ''}` +
      `${estimatedHours ? `⏱️ <b>Estimasi:</b> ${estimatedHours} jam\n` : ''}` +
      `${dueDate ? `📅 <b>Due Date:</b> ${new Date(dueDate).toLocaleDateString('id-ID')}\n` : ''}` +
      `🗂️ <b>Project ID:</b> #${projectId}\n` +
      `👤 <b>Dibuat oleh:</b> ${session.email}\n` +
      `🕐 <b>Waktu:</b> ${formatDateWIB()}`
    );

    return NextResponse.json({
      success: true,
      taskId: newTask.insertId,
      message: 'Task created successfully',
    });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
