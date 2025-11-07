import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { taskAttachments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid attachment ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const attachmentId = parseInt(id);

    // Check if attachment exists
    const existingAttachment = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.id, attachmentId))
      .limit(1);

    if (existingAttachment.length === 0) {
      return NextResponse.json(
        { error: 'Attachment not found', code: 'ATTACHMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization check: Only the uploader can delete
    if (existingAttachment[0].uploadedBy !== session.user.id) {
      return NextResponse.json(
        { 
          error: 'You are not authorized to delete this attachment', 
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // Delete attachment
    const deleted = await db
      .delete(taskAttachments)
      .where(
        and(
          eq(taskAttachments.id, attachmentId),
          eq(taskAttachments.uploadedBy, session.user.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete attachment', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Attachment deleted successfully',
        attachment: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE attachment error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}