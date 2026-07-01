import { NextRequest, NextResponse } from "next/server";

// AUTHENTICATION DISABLED FOR DEVELOPMENT
// All routes are now publicly accessible

export async function middleware(request: NextRequest) {
  console.log('🚀 Middleware: Authentication DISABLED - allowing access to:', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/reports/:path*", "/knowledge-base/:path*", "/tickets/:path*"],
};