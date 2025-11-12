import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { HTTP_STATUS, ERROR_MESSAGES } from "@/lib/constants";
import { SessionUser } from "@/types/api";

export interface AuthContext {
  user: SessionUser;
  session: any;
}

/**
 * Get the current authenticated user from the session
 */
export async function getCurrentUser(): Promise<AuthContext | null> {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      siteId: true,
      isActive: true,
      adminSites: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Block inactive users
  if (!user.isActive) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      siteId: user.siteId,
      adminSites: user.adminSites,
    },
    session,
  };
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(): Promise<AuthContext> {
  const authContext = await getCurrentUser();
  
  if (!authContext) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  // Block PENDING users from accessing protected routes
  if (authContext.user.role === "PENDING") {
    throw new ApiError("Account pending approval", HTTP_STATUS.FORBIDDEN);
  }

  return authContext;
}

/**
 * Middleware to require specific roles
 */
export async function requireRoles(
  allowedRoles: readonly Role[] | Role[]
): Promise<AuthContext> {
  const authContext = await requireAuth();

  if (!allowedRoles.includes(authContext.user.role)) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  return authContext;
}

/**
 * Middleware to require site access
 * Checks if user belongs to the site or has elevated permissions
 */
export async function requireSiteAccess(
  siteId: string,
  allowedRoles: readonly Role[] | Role[] = ["OWNER", "ADMIN"]
): Promise<AuthContext> {
  const authContext = await requireAuth();
  const { user } = authContext;

  // Allow if user has elevated role
  if (allowedRoles.includes(user.role)) {
    return authContext;
  }

  // For SITE_ADMIN, check if they have access to this site
  if (user.role === "SITE_ADMIN") {
    const hasAccess = user.adminSites?.some((site) => site.id === siteId);
    if (hasAccess) {
      return authContext;
    }
  }

  // Check if user belongs to this site
  if (user.siteId === siteId) {
    return authContext;
  }

  throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
}

/**
 * Check if user has permission to access a site
 */
export function canAccessSite(
  user: SessionUser,
  siteId: string,
  allowedRoles: readonly Role[] | Role[] = ["OWNER", "ADMIN"]
): boolean {
  // Allow if user has elevated role
  if (allowedRoles.includes(user.role)) {
    return true;
  }

  // For SITE_ADMIN, check if they have access to this site
  if (user.role === "SITE_ADMIN") {
    return user.adminSites?.some((site) => site.id === siteId) ?? false;
  }

  // Check if user belongs to this site
  return user.siteId === siteId;
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, data: error.data },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (typeof error === "object" && error !== null && "code" in error) {
    const prismaError = error as { code: string; meta?: any };
    
    if (prismaError.code === "P2002") {
      const field = prismaError.meta?.target?.[0] || "field";
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    if (prismaError.code === "P2025") {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }
  }

  return NextResponse.json(
    { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
