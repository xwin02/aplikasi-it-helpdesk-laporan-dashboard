import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendTelegramNotification, formatDateWIB } from '@/lib/telegram';

// GET all projects
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

    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return NextResponse.json({ projects: allProjects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new project
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
    const { title, description, priority, assignedTo, dueDate } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const [newProject] = await db.insert(projects).values({
      title,
      description: description || null,
      status: 'backlog',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      createdBy: session.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send Telegram notification (non-blocking)
    const priorityEmoji: Record<string, string> = {
      low: '🟢', medium: '🟡', high: '🟠', urgent: '🔴',
    };
    sendTelegramNotification(
      `📁 <b>PROJECT BARU DIBUAT</b>\n\n` +
      `📌 <b>Nama:</b> ${title}\n` +
      `${priorityEmoji[priority || 'medium']} <b>Prioritas:</b> ${(priority || 'medium').toUpperCase()}\n` +
      `${description ? `📝 <b>Deskripsi:</b> ${description}\n` : ''}` +
      `👤 <b>Dibuat oleh:</b> ${session.email}\n` +
      `🕐 <b>Waktu:</b> ${formatDateWIB()}`
    );

    return NextResponse.json({
      success: true,
      projectId: newProject.insertId,
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
