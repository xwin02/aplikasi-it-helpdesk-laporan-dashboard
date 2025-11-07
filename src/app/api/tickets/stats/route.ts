import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

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

    // Fetch all tickets from database
    let allTickets = await db.select().from(tickets);

    // Apply date filtering if provided
    if (month || year) {
      allTickets = allTickets.filter((ticket) => {
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

    // Initialize statistics object with all possible values
    const stats = {
      total: allTickets.length,
      byStatus: {
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      byCategory: {
        hardware: 0,
        software: 0,
        network: 0,
        access: 0,
        other: 0
      },
      monthlyBreakdown: [] as { month: string; count: number }[],
      averageResolutionTime: 0
    };

    // Map to track monthly counts
    const monthlyMap = new Map<string, number>();
    let totalResolutionTimeMs = 0;
    let resolvedTicketsCount = 0;

    // Process each ticket to build statistics
    allTickets.forEach(ticket => {
      // Count by status
      const status = ticket.status as keyof typeof stats.byStatus;
      if (status in stats.byStatus) {
        stats.byStatus[status]++;
      }

      // Count by priority
      const priority = ticket.priority as keyof typeof stats.byPriority;
      if (priority in stats.byPriority) {
        stats.byPriority[priority]++;
      }

      // Count by category
      const category = ticket.category as keyof typeof stats.byCategory;
      if (category in stats.byCategory) {
        stats.byCategory[category]++;
      }

      // Extract year-month from createdAt ISO timestamp
      if (ticket.createdAt) {
        const date = new Date(ticket.createdAt);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(yearMonth, (monthlyMap.get(yearMonth) || 0) + 1);
      }

      // Calculate resolution time for resolved/closed tickets
      if ((ticket.status === 'resolved' || ticket.status === 'closed') && ticket.resolvedAt) {
        const createdTime = new Date(ticket.createdAt).getTime();
        const resolvedTime = new Date(ticket.resolvedAt).getTime();
        totalResolutionTimeMs += (resolvedTime - createdTime);
        resolvedTicketsCount++;
      }
    });

    // Calculate average resolution time in hours
    if (resolvedTicketsCount > 0) {
      const averageMs = totalResolutionTimeMs / resolvedTicketsCount;
      stats.averageResolutionTime = Math.round(averageMs / (1000 * 60 * 60) * 10) / 10; // hours with 1 decimal
    }

    // Convert monthly map to array and sort by month descending
    stats.monthlyBreakdown = Array.from(monthlyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // Ensure we have the last 12 months represented
    const now = new Date();
    const last12Months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last12Months.push(yearMonth);
    }

    // Fill in missing months with zero counts
    const existingMonths = new Set(stats.monthlyBreakdown.map(m => m.month));
    last12Months.forEach(month => {
      if (!existingMonths.has(month)) {
        stats.monthlyBreakdown.push({ month, count: 0 });
      }
    });

    // Sort again after adding missing months
    stats.monthlyBreakdown.sort((a, b) => b.month.localeCompare(a.month));

    // Limit to last 12 months
    stats.monthlyBreakdown = stats.monthlyBreakdown.slice(0, 12);

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}