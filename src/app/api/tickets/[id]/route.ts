import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const VALID_CATEGORIES = ['hardware', 'software', 'network', 'access', 'other'] as const;
const VALID_DEPARTMENTS = ['IT', 'Sales', 'PPIC', 'RND', 'ACC-Finance', 'Exim', 'QC', 'Maintenance', 'HRD', 'CreativeDesign', 'Produksi', 'Security', 'VIP'];

type TicketStatus = typeof VALID_STATUSES[number];
type TicketPriority = typeof VALID_PRIORITIES[number];
type TicketCategory = typeof VALID_CATEGORIES[number];

interface UpdateTicketBody {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string | null;
  department?: string;
  requesterName?: string;
  resolution?: string | null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get session from cookies and verify
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const user = await verifySession(sessionCookie);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userRole = user.role;
    const userEmail = user.email;
    
    console.log('🔐 PATCH Ticket - User:', userEmail, 'Role:', userRole);

    const params = await context.params; // Await params for Next.js 15
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ticket ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const ticketId = parseInt(id);

    const existingTicket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (existingTicket.length === 0) {
      return NextResponse.json(
        { 
          error: 'Ticket not found',
          code: 'TICKET_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check ownership: 
    // - Superadmin and Teknisi can edit all tickets
    // - Regular users can only edit their own tickets
    if (userRole !== 'superadmin' && userRole !== 'teknisi' && existingTicket[0].userId !== userId) {
      return NextResponse.json(
        {
          error: 'You do not have permission to edit this ticket',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    const body: UpdateTicketBody = await request.json();
    const updates: Partial<typeof tickets.$inferInsert> = {};

    if (body.title !== undefined) {
      const trimmedTitle = body.title.trim();
      if (!trimmedTitle) {
        return NextResponse.json(
          { 
            error: 'Title cannot be empty',
            code: 'INVALID_TITLE'
          },
          { status: 400 }
        );
      }
      updates.title = trimmedTitle;
    }

    if (body.description !== undefined) {
      const trimmedDescription = body.description.trim();
      if (!trimmedDescription) {
        return NextResponse.json(
          { 
            error: 'Description cannot be empty',
            code: 'INVALID_DESCRIPTION'
          },
          { status: 400 }
        );
      }
      updates.description = trimmedDescription;
    }

    if (body.status !== undefined) {
      const trimmedStatus = body.status.trim().toLowerCase();
      if (!VALID_STATUSES.includes(trimmedStatus as TicketStatus)) {
        return NextResponse.json(
          { 
            error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS'
          },
          { status: 400 }
        );
      }
      updates.status = trimmedStatus;

      // Set resolvedAt timestamp when marking as resolved or closed
      if (
        (trimmedStatus === 'resolved' || trimmedStatus === 'closed') &&
        !existingTicket[0].resolvedAt
      ) {
        console.log('Setting resolvedAt for ticket', ticketId);
        updates.resolvedAt = sql`NOW()`; // Use MySQL NOW() function
      }
    }

    if (body.priority !== undefined) {
      const trimmedPriority = body.priority.trim().toLowerCase();
      if (!VALID_PRIORITIES.includes(trimmedPriority as TicketPriority)) {
        return NextResponse.json(
          { 
            error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
            code: 'INVALID_PRIORITY'
          },
          { status: 400 }
        );
      }
      updates.priority = trimmedPriority;
    }

    if (body.category !== undefined) {
      const trimmedCategory = body.category.trim().toLowerCase();
      if (!VALID_CATEGORIES.includes(trimmedCategory as TicketCategory)) {
        return NextResponse.json(
          { 
            error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
            code: 'INVALID_CATEGORY'
          },
          { status: 400 }
        );
      }
      updates.category = trimmedCategory;
    }

    if (body.assignedTo !== undefined) {
      updates.assignedTo = body.assignedTo ? body.assignedTo.trim() : null;
    }

    if (body.department !== undefined) {
      const trimmedDepartment = body.department.trim();
      if (!VALID_DEPARTMENTS.includes(trimmedDepartment)) {
        return NextResponse.json(
          { 
            error: `Department must be one of: ${VALID_DEPARTMENTS.join(', ')}`,
            code: 'INVALID_DEPARTMENT'
          },
          { status: 400 }
        );
      }
      updates.department = trimmedDepartment;
    }

    if (body.requesterName !== undefined) {
      const trimmedRequesterName = body.requesterName.trim();
      if (!trimmedRequesterName) {
        return NextResponse.json(
          { 
            error: 'Requester name cannot be empty',
            code: 'INVALID_REQUESTER_NAME'
          },
          { status: 400 }
        );
      }
      updates.requesterName = trimmedRequesterName;
    }

    if (body.resolution !== undefined) {
      updates.resolution = body.resolution ? body.resolution.trim() : null;
    }

    // Don't manually set updatedAt - schema has .onUpdateNow()

    await db
      .update(tickets)
      .set(updates)
      .where(eq(tickets.id, ticketId));

    // MySQL doesn't support .returning(), so we fetch the updated ticket
    const updatedTicket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (updatedTicket.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update ticket',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedTicket[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get session from cookies and verify
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const user = await verifySession(sessionCookie);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userRole = user.role;
    const userEmail = user.email;
    
    console.log('🔐 DELETE Ticket - User:', userEmail, 'Role:', userRole);

    const params = await context.params; // Await params for Next.js 15
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ticket ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const ticketId = parseInt(id);

    const existingTicket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (existingTicket.length === 0) {
      return NextResponse.json(
        { 
          error: 'Ticket not found',
          code: 'TICKET_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check ownership:
    // - Superadmin and Teknisi can delete all tickets
    // - Regular users can only delete their own tickets
    if (userRole !== 'superadmin' && userRole !== 'teknisi' && existingTicket[0].userId !== userId) {
      return NextResponse.json(
        {
          error: 'You do not have permission to delete this ticket',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    await db
      .delete(tickets)
      .where(eq(tickets.id, ticketId));

    return NextResponse.json(
      {
        message: 'Ticket deleted successfully',
        ticket: existingTicket[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}