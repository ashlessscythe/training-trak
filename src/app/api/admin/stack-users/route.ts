import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { PERMISSIONS } from "@/lib/permissions";

/**
 * API endpoint to list Stack Auth users
 * This is used by the admin user approval component to get a list of users
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify the current user has admin permissions
    const currentUser = await stackServerApp.getUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has admin, owner, or site_admin permission
    const isAdmin = await currentUser.getPermission(PERMISSIONS.ADMIN);
    const isOwner = await currentUser.getPermission(PERMISSIONS.OWNER);
    const isSiteAdmin = await currentUser.getPermission(PERMISSIONS.SITE_ADMIN);

    if (!isAdmin && !isOwner && !isSiteAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // 2. Get all Stack Auth users
    const users = await stackServerApp.listUsers();

    // 3. Filter sensitive information
    const filteredUsers = users.map((user) => ({
      id: user.id,
      primaryEmail: user.primaryEmail,
      displayName: user.displayName,
      clientMetadata: user.clientMetadata,
      clientReadOnlyMetadata: user.clientReadOnlyMetadata,
      // Registration date is stored in metadata
      registeredAt: user.clientReadOnlyMetadata?.registeredAt || null,
    }));

    // 4. For site admins, filter to only show users from their site
    if (isSiteAdmin && !isAdmin && !isOwner) {
      const adminSiteId = currentUser.clientMetadata?.siteId;

      // Return only users with matching site ID in metadata
      // or users with no site ID yet (pending users)
      return NextResponse.json(
        filteredUsers.filter((user) => {
          const userSiteId = user.clientMetadata?.siteId;
          return !userSiteId || userSiteId === adminSiteId;
        })
      );
    }

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error("Error listing Stack Auth users:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
