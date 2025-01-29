import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token as {
      role?: string;
      email?: string;
      siteId?: string;
    } | null;
    const isAuth = !!token;
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/auth/signin") ||
      req.nextUrl.pathname.startsWith("/auth/signup");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    // Handle admin route access
    if (isAdminRoute && !["ADMIN", "OWNER"].includes(token?.role || "")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Handle site admin access to their site's users
    if (req.nextUrl.pathname.startsWith("/sites/")) {
      const pathParts = req.nextUrl.pathname.split("/");
      const siteId = pathParts[2];
      const isSiteUsersPage = pathParts[3] === "users";

      if (isSiteUsersPage) {
        // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site
        if (token?.role === "SITE_ADMIN" && token?.siteId !== siteId) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/documents/:path*",
    "/sops/:path*",
    "/training/:path*",
    "/sites/:path*",
  ],
};
