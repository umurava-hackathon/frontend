import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSession = request.cookies.has("refreshToken");

  // If authenticated and trying to access public paths, redirect to dashboard
  if (hasSession && PUBLIC_PATHS.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Also handle root redirect
  if (hasSession && path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public paths for unauthenticated users
  if (PUBLIC_PATHS.includes(path)) {
    return NextResponse.next();
  }

  // Check for session cookie
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except static files, api routes, and _next internals
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
