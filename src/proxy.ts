import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  // Skip middleware for RSC requests and Next.js internal requests
  if (
    searchParams.has("_rsc") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/sites")
  ) {
    return NextResponse.next();
  }

  // Allow access to landing page for unauthenticated users
  if (!token && pathname === "/") {
    return NextResponse.next();
  }

  // If user is not logged in and trying to access protected routes
  if (!token && !pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // If user is logged in and trying to access auth pages
  if (token && pathname.startsWith("/auth")) {
    // Allow access to pending page for PENDING users
    if (pathname === "/auth/pending") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Block PENDING users from accessing any protected routes except the pending page
  if (token && token.role === "PENDING" && pathname !== "/auth/pending") {
    return NextResponse.redirect(new URL("/auth/pending", request.url));
  }

  // Handle site-specific routes
  if (pathname.startsWith("/sites/")) {
    const siteId = pathname.split("/")[2];
    const userRole = token?.role;
    const userSiteId = token?.siteId;
    const adminSites = token?.adminSites as { id: string }[] | undefined;

    // Allow OWNER and ADMIN to access any site
    if (["OWNER", "ADMIN"].includes(userRole as string)) {
      return NextResponse.next();
    }

    // For SITE_ADMIN, check if they have access to this site
    if (userRole === "SITE_ADMIN") {
      // If no adminSites array, allow access (will be checked in API)
      if (!adminSites) {
        return NextResponse.next();
      }
      const hasAccess = adminSites.some((site) => site.id === siteId);
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.next();
    }

    // For other roles, check if they belong to this site
    if (userSiteId !== siteId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
