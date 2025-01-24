import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const path = req.nextUrl.pathname;

    // Only redirect pending users if they try to access non-auth routes
    if (token?.role === "PENDING" && !path.startsWith("/auth/")) {
      return Response.redirect(new URL("/auth/pending", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Only protect app routes, allow access to landing page and auth routes
export const config = {
  matcher: ["/app/:path*"],
};
