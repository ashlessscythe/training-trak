import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { stackServerApp } from "./stack";
import { PERMISSIONS } from "./lib/permissions";

export async function middleware(request: NextRequest) {
  // Handle 127.0.0.1 to localhost redirection to prevent cookie issues
  const host = request.headers.get("host");
  if (host && host.startsWith("127.0.0.1")) {
    // Replace 127.0.0.1 with localhost in the URL
    const url = new URL(request.url);
    url.host = url.host.replace("127.0.0.1", "localhost");
    return NextResponse.redirect(url);
  }
  const user = await stackServerApp.getUser();
  const isAuth = !!user;
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/auth/signin") ||
    request.nextUrl.pathname.startsWith("/auth/signup") ||
    request.nextUrl.pathname.startsWith("/handler/");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuth) {
    // Use Stack Auth's built-in redirect mechanism
    // Use the stackServerApp.urls.signIn to ensure consistency
    const redirectUrl = new URL(
      `${stackServerApp.urls.signIn}?redirect=${encodeURIComponent(
        request.nextUrl.pathname + request.nextUrl.search
      )}`,
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Get user site from clientMetadata for backward compatibility
  const userSiteId = (user.clientMetadata?.siteId as string) || "";

  // Handle admin route access - check if user has admin or owner permission
  if (isAdminRoute) {
    const isAdmin = await user.getPermission(PERMISSIONS.ADMIN);
    const isOwner = await user.getPermission(PERMISSIONS.OWNER);

    if (!isAdmin && !isOwner) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Handle site admin access to their site's users
  if (request.nextUrl.pathname.startsWith("/sites/")) {
    const pathParts = request.nextUrl.pathname.split("/");
    const siteId = pathParts[2];
    const isSiteUsersPage = pathParts[3] === "users";

    if (isSiteUsersPage) {
      const isAdmin = await user.getPermission(PERMISSIONS.ADMIN);
      const isOwner = await user.getPermission(PERMISSIONS.OWNER);
      const isSiteAdmin = await user.getPermission(PERMISSIONS.SITE_ADMIN);

      // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site
      if (isSiteAdmin && !isAdmin && !isOwner && userSiteId !== siteId) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Future implementation: When sites are implemented as teams
      // const siteTeam = await user.getTeam(siteId);
      // const hasAccess = await user.getPermission(siteTeam, PERMISSIONS.ACCESS_SITE);
      // if (!hasAccess) {
      //   return NextResponse.redirect(new URL("/dashboard", request.url));
      // }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/documents/:path*",
    "/sops/:path*",
    "/training/:path*",
    "/sites/:path*",
    "/auth/signin",
    "/auth/signup",
  ],
};
