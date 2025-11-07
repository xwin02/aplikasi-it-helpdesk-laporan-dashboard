import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { taskAttachments, taskActivities, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, fileName, fileUrl, fileSize, fileType } = body;

    // Validate required fields
    if (!taskId) {
      return NextResponse.json({ 
        error: 'Task ID is required', 
        code: 'MISSING_TASK_ID' 
      }, { status: 400 });
    }

    if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
      return NextResponse.json({ 
        error: 'File name is required and must be a non-empty string', 
        code: 'INVALID_FILE_NAME' 
      }, { status: 400 });
    }

    if (fileName.trim().length > 255) {
      return NextResponse.json({ 
        error: 'File name must not exceed 255 characters', 
        code: 'FILE_NAME_TOO_LONG' 
      }, { status: 400 });
    }

    if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim() === '') {
      return NextResponse.json({ 
        error: 'File URL is required and must be a non-empty string', 
        code: 'INVALID_FILE_URL' 
      }, { status: 400 });
    }

    if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json({ 
        error: 'File size is required and must be a positive integer', 
        code: 'INVALID_FILE_SIZE' 
      }, { status: 400 });
    }

    if (!Number.isInteger(fileSize)) {
      return NextResponse.json({ 
        error: 'File size must be an integer', 
        code: 'INVALID_FILE_SIZE' 
      }, { status: 400 });
    }

    if (!fileType || typeof fileType !== 'string' || fileType.trim() === '') {
      return NextResponse.json({ 
        error: 'File type is required and must be a non-empty string', 
        code: 'INVALID_FILE_TYPE' 
      }, { status: 400 });
    }

    // Validate MIME type pattern (type/subtype)
    const mimeTypePattern = /^[a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+$/;
    if (!mimeTypePattern.test(fileType.trim())) {
      return NextResponse.json({ 
        error: 'File type must be a valid MIME type (e.g., image/png, application/pdf)', 
        code: 'INVALID_MIME_TYPE' 
      }, { status: 400 });
    }

    // Validate taskId is a valid integer
    const taskIdInt = parseInt(taskId);
    if (isNaN(taskIdInt)) {
      return NextResponse.json({ 
        error: 'Task ID must be a valid integer', 
        code: 'INVALID_TASK_ID' 
      }, { status: 400 });
    }

    // Verify task exists
    const existingTask = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskIdInt))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ 
        error: 'Task not found', 
        code: 'TASK_NOT_FOUND' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create attachment record
    const newAttachment = await db.insert(taskAttachments)
      .values({
        taskId: taskIdInt,
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        fileSize: fileSize,
        fileType: fileType.trim(),
        uploadedBy: session.user.id,
        createdAt: now,
      })
      .returning();

    // Create activity log
    await db.insert(taskActivities)
      .values({
        taskId: taskIdInt,
        userId: session.user.id,
        action: 'attached_file',
        details: JSON.stringify({ 
          fileName: fileName.trim(), 
          fileSize: fileSize 
        }),
        createdAt: now,
      });

    return NextResponse.json(newAttachment[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}