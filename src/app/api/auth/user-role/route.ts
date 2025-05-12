import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import {
  mapRoleToPermission,
  PERMISSIONS,
  PERMISSION_HIERARCHY,
} from "@/lib/permissions";
import { grantProjectPermission } from "@/lib/stack-helpers";

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, siteId } = await request.json();

    // Update user metadata with role and siteId for backward compatibility
    await user.update({
      clientMetadata: {
        ...user.clientMetadata,
        role,
        siteId,
      },
    });

    try {
      // Map the role to a Stack Auth permission
      const permission = mapRoleToPermission(role);

      // Grant the permission to the user (project-level permission)
      await grantProjectPermission(user.id, permission);

      // Grant all included permissions based on the hierarchy
      if (PERMISSION_HIERARCHY[permission]) {
        for (const includedPermission of PERMISSION_HIERARCHY[permission]) {
          await grantProjectPermission(user.id, includedPermission);
        }
      }

      // If this is a SITE_ADMIN role, we could also add the user to the site's team
      // This would be implemented when we migrate to using teams for sites
      if (role === "SITE_ADMIN" && siteId) {
        // Future implementation: Add user to site team
        // const siteTeam = await stackServerApp.getTeam(siteId);
        // if (siteTeam) await siteTeam.addUser(user.id);
      }
    } catch (error) {
      console.error("Error granting permissions:", error);
      // Continue with the update process even if permission granting fails
      // This ensures backward compatibility during the migration
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
