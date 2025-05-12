import { stackServerApp } from "@/stack";
import { PERMISSIONS, PERMISSION_HIERARCHY } from "./permissions";
import { grantProjectPermission } from "./stack-helpers";

// Define default teams
export const DEFAULT_TEAMS = {
  ADMIN_TEAM: "admin-team",
  SITE_TEAM_PREFIX: "site-", // Will be followed by site ID
  SUPERVISOR_TEAM: "supervisors",
};

// Define team permissions mapping
export const TEAM_PERMISSIONS = {
  [DEFAULT_TEAMS.ADMIN_TEAM]: [
    PERMISSIONS.ADMIN,
    PERMISSIONS.ASSIGN_TRAINING,
    PERMISSIONS.MODIFY_TRAINING,
    PERMISSIONS.MARK_SOP_CRITICAL,
    PERMISSIONS.EDIT_SOP,
  ],
  [DEFAULT_TEAMS.SUPERVISOR_TEAM]: [
    PERMISSIONS.SUPERVISOR,
    PERMISSIONS.ASSIGN_TRAINING,
    PERMISSIONS.MODIFY_TRAINING,
  ],
};

/**
 * Bootstrap function to ensure all required teams and permissions exist
 * This should be called during app initialization or first admin login
 */
export async function bootstrapTeamsAndPermissions(): Promise<void> {
  try {
    console.log("Starting Stack Auth bootstrap process...");

    // 1. Ensure default teams exist
    await ensureDefaultTeamsExist();

    // 2. Ensure all permissions are set up correctly
    await ensurePermissionsExist();

    console.log("Stack Auth bootstrap completed successfully");
  } catch (error) {
    console.error("Error during Stack Auth bootstrap:", error);
    throw error;
  }
}

/**
 * Ensure all default teams exist
 */
async function ensureDefaultTeamsExist(): Promise<void> {
  try {
    // Create admin team if it doesn't exist
    await ensureTeamExists(DEFAULT_TEAMS.ADMIN_TEAM, "Admin Team");

    // Create supervisor team if it doesn't exist
    await ensureTeamExists(DEFAULT_TEAMS.SUPERVISOR_TEAM, "Supervisors");

    console.log("Default teams verified");
  } catch (error) {
    console.error("Error ensuring default teams exist:", error);
    throw error;
  }
}

/**
 * Ensure a specific team exists, create it if it doesn't
 */
export async function ensureTeamExists(
  teamId: string,
  displayName: string
): Promise<any> {
  try {
    // Try to get the team first
    let team;
    try {
      team = await stackServerApp.getTeam(teamId);
    } catch (error) {
      // Team doesn't exist, will be created below
    }

    // If team doesn't exist, create it
    if (!team) {
      console.log(`Creating team: ${displayName} (${teamId})`);
      // Create the team with just the display name
      team = await stackServerApp.createTeam({
        displayName: displayName,
      });

      // Then update it to add metadata
      if (team) {
        await team.update({
          clientMetadata: {
            teamId: teamId, // Store the intended ID in metadata since we can't set it directly
            createdByBootstrap: true,
            createdAt: new Date().toISOString(),
          },
        });
      }
      console.log(`Team created: ${displayName}`);
    }

    return team;
  } catch (error) {
    console.error(`Error ensuring team exists (${teamId}):`, error);
    throw error;
  }
}

/**
 * Ensure a site-specific team exists
 */
export async function ensureSiteTeamExists(
  siteId: string,
  siteName: string
): Promise<any> {
  const teamId = `${DEFAULT_TEAMS.SITE_TEAM_PREFIX}${siteId}`;
  return ensureTeamExists(teamId, `${siteName} Team`);
}

/**
 * Ensure all permissions exist and are properly configured
 */
async function ensurePermissionsExist(): Promise<void> {
  try {
    // For each permission in our hierarchy, ensure it exists
    for (const [permissionId, includedPermissions] of Object.entries(
      PERMISSION_HIERARCHY
    )) {
      await ensurePermissionExists(permissionId, includedPermissions);
    }

    console.log("Permissions verified");
  } catch (error) {
    console.error("Error ensuring permissions exist:", error);
    throw error;
  }
}

/**
 * Ensure a specific permission exists with the correct included permissions
 */
async function ensurePermissionExists(
  permissionId: string,
  includedPermissions: string[]
): Promise<void> {
  try {
    // Check if permission exists by trying to create it
    // If it already exists, the creation will fail but that's okay
    console.log(`Ensuring permission exists: ${permissionId}`);

    try {
      // @ts-ignore - Check at runtime if the function exists
      if (typeof stackServerApp.createPermission === "function") {
        // @ts-ignore - Function existence checked at runtime
        await stackServerApp.createPermission(permissionId, {
          includes: includedPermissions,
        });
        console.log(`Permission created: ${permissionId}`);
      } else {
        console.warn(
          `Cannot create permission ${permissionId}: API not available`
        );
      }
    } catch (error) {
      // If error contains "already exists", the permission already exists
      if (
        error instanceof Error &&
        error.message &&
        error.message.includes("already exists")
      ) {
        console.log(`Permission ${permissionId} already exists`);
      } else {
        console.error(`Error creating permission ${permissionId}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error ensuring permission exists (${permissionId}):`, error);
    throw error;
  }
}

/**
 * Add a user to a team
 */
export async function addUserToTeam(
  userId: string,
  teamId: string
): Promise<void> {
  try {
    const team = await stackServerApp.getTeam(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    await team.addUser(userId);
    console.log(`User ${userId} added to team ${teamId}`);
  } catch (error) {
    console.error(`Error adding user ${userId} to team ${teamId}:`, error);
    throw error;
  }
}

/**
 * Add a user to a site team based on their site ID
 */
export async function addUserToSiteTeam(
  userId: string,
  siteId: string,
  siteName: string
): Promise<void> {
  // Ensure the site team exists
  const team = await ensureSiteTeamExists(siteId, siteName);

  // Add the user to the team
  await addUserToTeam(userId, team.id);
}

/**
 * Set up initial permissions for a newly registered user (Pending status)
 */
export async function setupPendingUserPermissions(
  userId: string
): Promise<void> {
  try {
    // Grant only the basic USER permission to new registrations
    await grantProjectPermission(userId, PERMISSIONS.USER);

    // Add a "pending" flag to the user's metadata
    const user = await stackServerApp.getUser(userId);
    if (user) {
      await user.update({
        clientReadOnlyMetadata: {
          ...user.clientReadOnlyMetadata,
          status: "PENDING",
          registeredAt: new Date().toISOString(),
        },
      });
    }

    console.log(`User ${userId} set up with pending status`);
  } catch (error) {
    console.error(`Error setting up pending user ${userId}:`, error);
    throw error;
  }
}

/**
 * Assign appropriate permissions and team memberships based on user role
 * This should be called after a user is approved by an admin
 */
export async function setupUserPermissionsAndTeams(
  userId: string,
  role: string,
  siteId: string,
  siteName: string
): Promise<void> {
  try {
    // 1. Grant base permission based on role
    const roleUpper = role.toUpperCase();
    // Type-safe way to access PERMISSIONS
    let permissionToGrant = PERMISSIONS.USER;
    if (roleUpper === "OWNER") permissionToGrant = PERMISSIONS.OWNER;
    else if (roleUpper === "ADMIN") permissionToGrant = PERMISSIONS.ADMIN;
    else if (roleUpper === "SITE_ADMIN")
      permissionToGrant = PERMISSIONS.SITE_ADMIN;
    else if (roleUpper === "SUPERVISOR")
      permissionToGrant = PERMISSIONS.SUPERVISOR;

    await grantProjectPermission(userId, permissionToGrant);

    // 2. Add to appropriate teams based on role
    if (role === "ADMIN" || role === "OWNER") {
      await addUserToTeam(userId, DEFAULT_TEAMS.ADMIN_TEAM);
    } else if (role === "SITE_ADMIN") {
      // Site admins get added to their site team
      await addUserToSiteTeam(userId, siteId, siteName);
    } else if (role === "SUPERVISOR") {
      await addUserToTeam(userId, DEFAULT_TEAMS.SUPERVISOR_TEAM);
      // Supervisors also get added to their site team
      await addUserToSiteTeam(userId, siteId, siteName);
    } else {
      // Regular users just get added to their site team
      await addUserToSiteTeam(userId, siteId, siteName);
    }

    // 3. Update the user's metadata to reflect approved status
    const user = await stackServerApp.getUser(userId);
    if (user) {
      await user.update({
        clientReadOnlyMetadata: {
          ...user.clientReadOnlyMetadata,
          status: "ACTIVE",
          approvedAt: new Date().toISOString(),
        },
      });
    }

    console.log(`User ${userId} permissions and teams set up for role ${role}`);
  } catch (error) {
    console.error(
      `Error setting up user permissions and teams for ${userId}:`,
      error
    );
    throw error;
  }
}
