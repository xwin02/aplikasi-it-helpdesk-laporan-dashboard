import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_CATEGORIES = ['hardware', 'software', 'network', 'access', 'other'];
const VALID_DEPARTMENTS = ['IT', 'Sales', 'PPIC', 'RND', 'ACC-Finance', 'Exim', 'QC', 'Maintenance', 'HRD', 'CreativeDesign', 'Produksi', 'Security', 'VIP'];

export async function GET(request: NextRequest) {
  try {
    // Get session from bearer token
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { user } = session;
    const userRole = user.role || 'user';

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single ticket fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      let query = db.select().from(tickets).where(eq(tickets.id, parseInt(id)));

      // If user role, only allow seeing their own tickets
      if (userRole === 'user') {
        query = db.select().from(tickets).where(
          and(
            eq(tickets.id, parseInt(id)),
            eq(tickets.userId, user.id)
          )
        );
      }

      const ticket = await query.limit(1);

      if (ticket.length === 0) {
        return NextResponse.json(
          { error: 'Ticket not found', code: 'TICKET_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(ticket[0], { status: 200 });
    }

    // List tickets with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Validate status filter
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value', code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Validate priority filter
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value', code: 'INVALID_PRIORITY' },
        { status: 400 }
      );
    }

    // Validate category filter
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category value', code: 'INVALID_CATEGORY' },
        { status: 400 }
      );
    }

    // Validate month filter
    if (month) {
      const monthNum = parseInt(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: 'Month must be between 1 and 12', code: 'INVALID_MONTH' },
          { status: 400 }
        );
      }
    }

    // Validate year filter
    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || year.length !== 4) {
        return NextResponse.json(
          { error: 'Year must be a valid 4-digit number', code: 'INVALID_YEAR' },
          { status: 400 }
        );
    }
    }

    let query = db.select().from(tickets);

    // Build filter conditions
    const conditions = [];

    // Role-based filtering: users can only see their own tickets
    if (userRole === 'user') {
      conditions.push(eq(tickets.userId, user.id));
    }
    // Admin and teknisi can see all tickets (no additional condition needed)

    if (status) {
      conditions.push(eq(tickets.status, status));
    }

    if (priority) {
      conditions.push(eq(tickets.priority, priority));
    }

    if (category) {
      conditions.push(eq(tickets.category, category));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Execute query
    let results = await query.orderBy(desc(tickets.createdAt)).limit(limit).offset(offset);

    // Apply date filtering in memory (since SQLite text dates need parsing)
    if (month || year) {
      results = results.filter((ticket) => {
        const createdDate = new Date(ticket.createdAt);
        const ticketMonth = createdDate.getMonth() + 1; // 1-12
        const ticketYear = createdDate.getFullYear();

        if (month && ticketMonth !== parseInt(month)) {
          return false;
        }

        if (year && ticketYear !== parseInt(year)) {
          return false;
        }

        return true;
      });
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session from bearer token
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, category, requesterName, department, assignedTo } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required and must not be empty', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required and must not be empty', code: 'MISSING_DESCRIPTION' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category is required', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    if (!requesterName || typeof requesterName !== 'string' || requesterName.trim() === '') {
      return NextResponse.json(
        { error: 'Requester name is required', code: 'MISSING_REQUESTER_NAME' },
        { status: 400 }
      );
    }

    if (!department || typeof department !== 'string' || department.trim() === '') {
      return NextResponse.json(
        { error: 'Department is required', code: 'MISSING_DEPARTMENT' },
        { status: 400 }
      );
    }

    // Validate department
    if (!VALID_DEPARTMENTS.includes(department.trim())) {
      return NextResponse.json(
        {
          error: `Department must be one of: ${VALID_DEPARTMENTS.join(', ')}`,
          code: 'INVALID_DEPARTMENT',
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        {
          error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
          code: 'INVALID_PRIORITY',
        },
        { status: 400 }
      );
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category.trim())) {
      return NextResponse.json(
        {
          error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: 'INVALID_CATEGORY',
        },
        { status: 400 }
      );
    }

    // Prepare insert data with defaults and timestamps
    const currentTimestamp = new Date().toISOString();
    const insertData = {
      title: title.trim(),
      description: description.trim(),
      status: status || 'open',
      priority: priority || 'medium',
      category: category.trim(),
      requesterName: requesterName.trim(),
      department: department.trim(),
      assignedTo: assignedTo ? (typeof assignedTo === 'string' ? assignedTo.trim() : assignedTo) : null,
      userId: session.user.id, // Automatically set from session
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      resolvedAt: null,
    };

    const newTicket = await db.insert(tickets).values(insertData).returning();

    return NextResponse.json(newTicket[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const ticketId = parseInt(id);

    // Check if ticket exists
    const existingTicket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (existingTicket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found', code: 'TICKET_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, category } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return NextResponse.json(
          { error: 'Title must not be empty', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }

      if (title.trim().length > 255) {
        return NextResponse.json(
          { error: 'Title must not exceed 255 characters', code: 'TITLE_TOO_LONG' },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        {
          error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
          code: 'INVALID_PRIORITY',
        },
        { status: 400 }
      );
    }

    // Validate category length if provided
    if (category !== undefined && typeof category === 'string' && category.length > 100) {
      return NextResponse.json(
        { error: 'Category must not exceed 100 characters', code: 'CATEGORY_TOO_LONG' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? (typeof description === 'string' ? description.trim() : description) : null;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (category !== undefined) {
      updateData.category = category ? (typeof category === 'string' ? category.trim() : category) : null;
    }

    const updatedTicket = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, ticketId))
      .returning();

    return NextResponse.json(updatedTicket[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}