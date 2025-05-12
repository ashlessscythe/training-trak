import { NextRequest, NextResponse } from "next/server";
import { handleUserApproval } from "@/lib/stack-auth-integration";
import { stackServerApp } from "@/stack";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * API endpoint to approve a pending user
 * This is called from the admin user approval component
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the current user has admin permissions
    const currentUser = await stackServerApp.getUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has admin or owner permission
    const isAdmin = await currentUser.getPermission(PERMISSIONS.ADMIN);
    const isOwner = await currentUser.getPermission(PERMISSIONS.OWNER);
    const isSiteAdmin = await currentUser.getPermission(PERMISSIONS.SITE_ADMIN);

    if (!isAdmin && !isOwner && !isSiteAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // 2. Get request data
    const data = await request.json();
    const { userId, role, siteId, departmentId, positionId } = data;

    // Validate required fields
    if (!userId || !role || !siteId || !departmentId || !positionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3. Site admins can only approve users for their own site
    if (isSiteAdmin && !isAdmin && !isOwner) {
      // Get the site admin's site from metadata
      const adminSiteId = currentUser.clientMetadata?.siteId;
      if (adminSiteId !== siteId) {
        return NextResponse.json(
          { error: "Site admins can only approve users for their own site" },
          { status: 403 }
        );
      }
    }

    // 4. Site admins can't create admins or owners
    if (
      isSiteAdmin &&
      !isAdmin &&
      !isOwner &&
      (role === "ADMIN" || role === "OWNER")
    ) {
      return NextResponse.json(
        { error: "Site admins cannot create admin or owner users" },
        { status: 403 }
      );
    }

    // 5. Process the user approval
    await handleUserApproval(userId, role, siteId, departmentId, positionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error approving user:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
