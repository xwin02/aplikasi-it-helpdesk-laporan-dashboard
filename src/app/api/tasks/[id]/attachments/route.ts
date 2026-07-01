import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { db } from '@/db';
import { taskAttachments } from '@/db/schema';
import { eq } from 'drizzle-orm';

const allowedRoles = ['superadmin', 'teknisi'];

// GET task attachments
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

    const attachments = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, parseInt(id)));

    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('Get attachments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create attachment (base64 image)
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
    const { fileName, fileUrl, fileSize, fileType } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { error: 'File name and URL are required' },
        { status: 400 }
      );
    }

    const [newAttachment] = await db.insert(taskAttachments).values({
      taskId: parseInt(id),
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      fileType: fileType || 'image/png',
      uploadedBy: session.id,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      attachmentId: newAttachment.insertId,
      message: 'Attachment uploaded successfully',
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE attachment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = await verifySession(token);
    if (!session || !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.delete(taskAttachments).where(eq(taskAttachments.id, parseInt(attachmentId)));

    return NextResponse.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
