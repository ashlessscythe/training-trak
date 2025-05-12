import { stackServerApp } from "@/stack";

/**
 * Helper function to grant a project permission to a user
 * This handles the differences between Stack Auth versions
 */
export async function grantProjectPermission(
  userId: string,
  permission: string
): Promise<void> {
  try {
    // Try the newer API first (if available)
    // @ts-ignore - Check at runtime if the function exists
    if (typeof stackServerApp.grantPermission === "function") {
      // @ts-ignore - Function existence checked at runtime
      await stackServerApp.grantPermission(userId, permission);
      return;
    }

    // Fall back to the user-based API
    const user = await stackServerApp.getUser();
    if (user && typeof user.grantPermission === "function") {
      // Some versions expect a team parameter, others don't
      try {
        // @ts-ignore - Try without team parameter first
        await user.grantPermission(permission);
      } catch (e) {
        // If that fails, try with null as team parameter
        // @ts-ignore - Type safety is handled at runtime
        await user.grantPermission(null, permission);
      }
    }
  } catch (error) {
    console.error(
      `Failed to grant permission ${permission} to user ${userId}:`,
      error
    );
  }
}

/**
 * Helper function to revoke a project permission from a user
 * This handles the differences between Stack Auth versions
 */
export async function revokeProjectPermission(
  userId: string,
  permission: string
): Promise<void> {
  try {
    // Try the newer API first (if available)
    // @ts-ignore - Check at runtime if the function exists
    if (typeof stackServerApp.revokePermission === "function") {
      // @ts-ignore - Function existence checked at runtime
      await stackServerApp.revokePermission(userId, permission);
      return;
    }

    // Fall back to the user-based API
    const user = await stackServerApp.getUser();
    if (user && typeof user.revokePermission === "function") {
      // Some versions expect a team parameter, others don't
      try {
        // @ts-ignore - Try without team parameter first
        await user.revokePermission(permission);
      } catch (e) {
        // If that fails, try with null as team parameter
        // @ts-ignore - Type safety is handled at runtime
        await user.revokePermission(null, permission);
      }
    }
  } catch (error) {
    console.error(
      `Failed to revoke permission ${permission} from user ${userId}:`,
      error
    );
  }
}
