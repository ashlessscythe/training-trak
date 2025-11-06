import { Role } from "@prisma/client";
import { ROLES, ADMIN_ROLES, SITE_MANAGEMENT_ROLES, ELEVATED_ROLES } from "./constants";
import { SessionUser } from "@/types/api";

export enum Permission {
  // User permissions
  USER_READ = "user:read",
  USER_CREATE = "user:create",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",
  USER_APPROVE = "user:approve",

  // Site permissions
  SITE_READ = "site:read",
  SITE_CREATE = "site:create",
  SITE_UPDATE = "site:update",
  SITE_DELETE = "site:delete",
  SITE_MANAGE_ADMINS = "site:manage_admins",

  // Department permissions
  DEPARTMENT_READ = "department:read",
  DEPARTMENT_CREATE = "department:create",
  DEPARTMENT_UPDATE = "department:update",
  DEPARTMENT_DELETE = "department:delete",

  // Position permissions
  POSITION_READ = "position:read",
  POSITION_CREATE = "position:create",
  POSITION_UPDATE = "position:update",
  POSITION_DELETE = "position:delete",

  // Training permissions
  TRAINING_READ = "training:read",
  TRAINING_CREATE = "training:create",
  TRAINING_UPDATE = "training:update",
  TRAINING_DELETE = "training:delete",
  TRAINING_ASSIGN = "training:assign",

  // Document permissions
  DOCUMENT_READ = "document:read",
  DOCUMENT_UPLOAD = "document:upload",
  DOCUMENT_UPDATE = "document:update",
  DOCUMENT_DELETE = "document:delete",

  // SOP permissions
  SOP_READ = "sop:read",
  SOP_CREATE = "sop:create",
  SOP_UPDATE = "sop:update",
  SOP_DELETE = "sop:delete",

  // Report permissions
  REPORT_VIEW = "report:view",
  REPORT_EXPORT = "report:export",
}

// Role-based permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    // Full access to everything
    ...Object.values(Permission),
  ],
  ADMIN: [
    // Full access to everything
    ...Object.values(Permission),
  ],
  SITE_ADMIN: [
    // User management within their sites
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_APPROVE,

    // Site read access
    Permission.SITE_READ,

    // Department management
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_CREATE,
    Permission.DEPARTMENT_UPDATE,
    Permission.DEPARTMENT_DELETE,

    // Position management
    Permission.POSITION_READ,
    Permission.POSITION_CREATE,
    Permission.POSITION_UPDATE,
    Permission.POSITION_DELETE,

    // Training management
    Permission.TRAINING_READ,
    Permission.TRAINING_CREATE,
    Permission.TRAINING_UPDATE,
    Permission.TRAINING_DELETE,
    Permission.TRAINING_ASSIGN,

    // Document management
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_UPLOAD,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_DELETE,

    // SOP management
    Permission.SOP_READ,
    Permission.SOP_CREATE,
    Permission.SOP_UPDATE,
    Permission.SOP_DELETE,

    // Reports
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
  ],
  SUPERVISOR: [
    // User read access
    Permission.USER_READ,

    // Site read access
    Permission.SITE_READ,

    // Department read access
    Permission.DEPARTMENT_READ,

    // Position read access
    Permission.POSITION_READ,

    // Training management
    Permission.TRAINING_READ,
    Permission.TRAINING_ASSIGN,

    // Document access
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_UPLOAD,

    // SOP access
    Permission.SOP_READ,
    Permission.SOP_CREATE,
    Permission.SOP_UPDATE,

    // Reports
    Permission.REPORT_VIEW,
  ],
  USER: [
    // Basic read access
    Permission.SITE_READ,
    Permission.DEPARTMENT_READ,
    Permission.POSITION_READ,

    // Training access
    Permission.TRAINING_READ,

    // Document read access
    Permission.DOCUMENT_READ,

    // SOP read access
    Permission.SOP_READ,
  ],
  PENDING: [
    // No permissions until approved
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: SessionUser, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  user: SessionUser,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  user: SessionUser,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if user is an admin (OWNER or ADMIN)
 */
export function isAdmin(role: Role): boolean {
  return ADMIN_ROLES.includes(role as any);
}

/**
 * Check if user can manage sites (OWNER, ADMIN, or SITE_ADMIN)
 */
export function canManageSites(role: Role): boolean {
  return SITE_MANAGEMENT_ROLES.includes(role as any);
}

/**
 * Check if user has elevated privileges (OWNER, ADMIN, SITE_ADMIN, or SUPERVISOR)
 */
export function hasElevatedRole(role: Role): boolean {
  return ELEVATED_ROLES.includes(role as any);
}

/**
 * Check if user can access a specific site
 */
export function canAccessSite(
  user: SessionUser,
  siteId: string,
  requireManagement: boolean = false
): boolean {
  // Admins can access all sites
  if (isAdmin(user.role)) {
    return true;
  }

  // Site admins can access their assigned sites
  if (user.role === ROLES.SITE_ADMIN) {
    const hasAccess = user.adminSites?.some((site) => site.id === siteId) ?? false;
    return hasAccess;
  }

  // If management is required, only elevated roles can access
  if (requireManagement) {
    return false;
  }

  // Regular users can access their own site
  return user.siteId === siteId;
}

/**
 * Check if user can modify another user
 */
export function canModifyUser(
  currentUser: SessionUser,
  targetUserId: string,
  targetUserSiteId: string
): boolean {
  // Admins can modify anyone
  if (isAdmin(currentUser.role)) {
    return true;
  }

  // Site admins can modify users in their sites
  if (currentUser.role === ROLES.SITE_ADMIN) {
    return canAccessSite(currentUser, targetUserSiteId);
  }

  // Users can only modify themselves
  return currentUser.id === targetUserId;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role can perform an action on a resource
 */
export function canPerformAction(
  user: SessionUser,
  action: Permission,
  resourceSiteId?: string
): boolean {
  // Check if user has the permission
  if (!hasPermission(user, action)) {
    return false;
  }

  // If no site context, permission is sufficient
  if (!resourceSiteId) {
    return true;
  }

  // Check site access
  return canAccessSite(user, resourceSiteId);
}

/**
 * Filter items based on user's site access
 */
export function filterBySiteAccess<T extends { siteId: string }>(
  user: SessionUser,
  items: T[]
): T[] {
  // Admins see everything
  if (isAdmin(user.role)) {
    return items;
  }

  // Site admins see items from their sites
  if (user.role === ROLES.SITE_ADMIN) {
    return items.filter((item) => canAccessSite(user, item.siteId));
  }

  // Regular users see items from their site
  return items.filter((item) => item.siteId === user.siteId);
}
