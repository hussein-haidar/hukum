import { NextResponse } from "next/server";

const publicRoutes = ["/", "/admin/login", "/admin/register", "/admin/forgot-password", "/admin/reset-password"];

export function middleware(request) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // Jika bukan route public dan mulai dengan /admin, izinkan routing (otentikasi utama di layout.tsx)
  if (!isPublicRoute && path.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Untuk API routes, lewati saja
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next|api|.*\\..*).*)",
  ],
};