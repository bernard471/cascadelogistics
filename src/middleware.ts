import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname
  const { pathname } = request.nextUrl;
  
  // Check if accessing protected routes
  const isUserDashboard = pathname.startsWith("/user-dashboard");
  const isAdminDashboard = pathname.startsWith("/admin-dashboard");
  const isBackupDashboard = pathname.startsWith("/backup-dashboard");
  
  if (isUserDashboard || isAdminDashboard || isBackupDashboard) {
    // Check if user has session token
    const sessionToken = request.cookies.get("authjs.session-token") || 
                         request.cookies.get("__Secure-authjs.session-token");
    
    if (!sessionToken) {
      // No session, redirect to login
      const loginUrl = new URL("/member-login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/user-dashboard/:path*", "/admin-dashboard/:path*", "/backup-dashboard/:path*"],
};
