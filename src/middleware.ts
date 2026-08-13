import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPartnerPlatformEnabled } from "./lib/partner-platform/feature";

function isPathOrChild(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isPartnerPlatformEnabled()) {
    const isPartnerWorker = pathname.startsWith("/api/internal/partner-");
    if (isPartnerWorker) {
      return new NextResponse(null, {
        status: 204,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const isPartnerApi =
      isPathOrChild(pathname, "/api/v1") ||
      isPathOrChild(pathname, "/api/partner-portal") ||
      isPathOrChild(pathname, "/api/backup-dashboard/integrations");
    if (isPartnerApi) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const isPartnerArtifact =
      isPathOrChild(pathname, "/openapi") ||
      isPathOrChild(pathname, "/collections") ||
      isPathOrChild(pathname, "/examples");
    if (isPartnerArtifact) {
      return new NextResponse("Not Found", {
        status: 404,
        headers: { "Cache-Control": "private, no-store" },
      });
    }
  }
  
  const isUserDashboard = pathname.startsWith("/user-dashboard");
  const isAdminDashboard = pathname.startsWith("/admin-dashboard");
  const isBackupDashboard = pathname.startsWith("/backup-dashboard");
  
  if (isUserDashboard || isAdminDashboard || isBackupDashboard) {
    const sessionToken = request.cookies.get("authjs.session-token") || 
                         request.cookies.get("__Secure-authjs.session-token");
    
    if (!sessionToken) {
      const loginUrl = new URL("/member-login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user-dashboard/:path*",
    "/admin-dashboard/:path*",
    "/backup-dashboard/:path*",
    "/api/v1/:path*",
    "/api/partner-portal/:path*",
    "/api/backup-dashboard/integrations/:path*",
    "/api/internal/:path*",
    "/openapi/:path*",
    "/collections/:path*",
    "/examples/:path*",
  ],
};
