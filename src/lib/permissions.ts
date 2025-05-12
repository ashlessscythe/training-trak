// Stack Auth permissions mapping to our application roles
export const PERMISSIONS = {
  // Role-based permissions
  OWNER: "owner",
  ADMIN: "admin",
  SITE_ADMIN: "site_admin",
  SUPERVISOR: "supervisor",
  USER: "user",

  // Feature-based permissions
  ASSIGN_TRAINING: "assign_training",
  MODIFY_TRAINING: "modify_training",
  MARK_SOP_CRITICAL: "mark_sop_critical",
  EDIT_SOP: "edit_sop",

  // Site-specific permissions (will be used with teams)
  ACCESS_SITE: "access_site",
};

// Permission hierarchy - which permissions include others
export const PERMISSION_HIERARCHY = {
  [PERMISSIONS.OWNER]: [
    PERMISSIONS.ADMIN,
    PERMISSIONS.SITE_ADMIN,
    PERMISSIONS.SUPERVISOR,
    PERMISSIONS.USER,
    PERMISSIONS.ASSIGN_TRAINING,
    PERMISSIONS.MODIFY_TRAINING,
    PERMISSIONS.MARK_SOP_CRITICAL,
    PERMISSIONS.EDIT_SOP,
    PERMISSIONS.ACCESS_SITE,
  ],
  [PERMISSIONS.ADMIN]: [
    PERMISSIONS.SITE_ADMIN,
    PERMISSIONS.SUPERVISOR,
    PERMISSIONS.USER,
    PERMISSIONS.ASSIGN_TRAINING,
    PERMISSIONS.MODIFY_TRAINING,
    PERMISSIONS.MARK_SOP_CRITICAL,
    PERMISSIONS.EDIT_SOP,
    PERMISSIONS.ACCESS_SITE,
  ],
  [PERMISSIONS.SITE_ADMIN]: [
    PERMISSIONS.SUPERVISOR,
    PERMISSIONS.USER,
    PERMISSIONS.ASSIGN_TRAINING,
    PERMISSIONS.MODIFY_TRAINING,
    PERMISSIONS.MARK_SOP_CRITICAL,
    PERMISSIONS.EDIT_SOP,
    PERMISSIONS.ACCESS_SITE,
  ],
  [PERMISSIONS.SUPERVISOR]: [
    PERMISSIONS.USER,
    PERMISSIONS.MODIFY_TRAINING,
    PERMISSIONS.ACCESS_SITE,
  ],
  [PERMISSIONS.USER]: [PERMISSIONS.ACCESS_SITE],
};

// Map database roles to Stack Auth permissions
export function mapRoleToPermission(role: string): string {
  switch (role) {
    case "OWNER":
      return PERMISSIONS.OWNER;
    case "ADMIN":
      return PERMISSIONS.ADMIN;
    case "SITE_ADMIN":
      return PERMISSIONS.SITE_ADMIN;
    case "SUPERVISOR":
      return PERMISSIONS.SUPERVISOR;
    case "USER":
      return PERMISSIONS.USER;
    default:
      return PERMISSIONS.USER;
  }
}

// Helper function to check if a user has a specific permission
export async function hasPermission(
  user: any,
  permission: string
): Promise<boolean> {
  if (!user) return false;

  try {
    // Check if user has the permission directly (project permission)
    const userPermission = await user.getPermission(permission);
    return !!userPermission;
  } catch (error) {
    console.error(`Error checking permission ${permission}:`, error);
    return false;
  }
}
