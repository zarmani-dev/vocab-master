import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/"

  // Get the token from localStorage (this won't work in middleware, but we'll simulate it)
  // In a real app, you'd use a cookie or JWT token
  const isAuthenticated = false // We'll handle this client-side

  // Redirect unauthenticated users to login
  if (!isPublicPath && !isAuthenticated) {
    // We'll handle this client-side instead
    return NextResponse.next()
  }

  // Allow the request to continue
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
}

