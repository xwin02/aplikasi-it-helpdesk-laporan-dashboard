import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // If no session, redirect to login
  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role for protected routes
  const userRole = (session.user as any).role || "user";
  const protectedPaths = ["/dashboard", "/reports", "/knowledge-base"];
  
  // If user role tries to access admin/teknisi routes
  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    if (userRole === "user") {
      // Redirect regular users to tickets page
      return NextResponse.redirect(new URL("/tickets", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/reports", "/knowledge-base", "/tickets"],
};