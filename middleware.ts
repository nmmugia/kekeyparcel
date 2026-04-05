import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // Check if system is in maintenance mode
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true"

  if (isMaintenanceMode) {
    if (req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "System under maintenance" }, { status: 503 })
    }
    if (!req.nextUrl.pathname.startsWith("/maintenance")) {
      return NextResponse.rewrite(new URL("/maintenance", req.url))
    }
    return NextResponse.next()
  }

  // If not in maintenance mode but trying to access /maintenance, redirect away
  if (req.nextUrl.pathname.startsWith("/maintenance")) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const token = await getToken({ req })
  const isAuthenticated = !!token

  const isAuthPage = req.nextUrl.pathname.startsWith("/login")
  const isApiRoute = req.nextUrl.pathname.startsWith("/api")
  const isPublicRoute = ["/"].includes(req.nextUrl.pathname)

  if (isApiRoute) {
    return NextResponse.next()
  }

  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/home", req.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Role-based access control
  if (isAuthenticated) {
    const userRole = token.role as string

    // Admin-only routes
    const adminRoutes = ["/admin", "/member", "/deletion-requests"]
    const isAdminRoute = adminRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

    if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/home", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}

