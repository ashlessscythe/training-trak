import { useUser } from "@stackframe/stack";
import { useEffect, useState } from "react";
import { PERMISSIONS } from "@/lib/permissions";

export function useUserPermissions() {
  const user = useUser();
  const userSiteId = (user?.clientMetadata?.siteId as string) || undefined;

  // State for permissions
  const [permissions, setPermissions] = useState({
    canAssignTraining: false,
    canModifyTraining: false,
    canMarkSOPCritical: false,
    canEditSOP: false,
  });

  // State for roles
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  // Effect to check permissions when user changes
  useEffect(() => {
    if (!user) return;

    const checkPermissions = async () => {
      try {
        // Check each permission
        const assignTraining = await user.getPermission(
          PERMISSIONS.ASSIGN_TRAINING
        );
        const modifyTraining = await user.getPermission(
          PERMISSIONS.MODIFY_TRAINING
        );
        const markSOPCritical = await user.getPermission(
          PERMISSIONS.MARK_SOP_CRITICAL
        );
        const editSOP = await user.getPermission(PERMISSIONS.EDIT_SOP);

        // Check roles to determine userRole for backward compatibility
        const isOwner = await user.getPermission(PERMISSIONS.OWNER);
        const isAdmin = await user.getPermission(PERMISSIONS.ADMIN);
        const isSiteAdmin = await user.getPermission(PERMISSIONS.SITE_ADMIN);
        const isSupervisor = await user.getPermission(PERMISSIONS.SUPERVISOR);
        const isUser = await user.getPermission(PERMISSIONS.USER);

        // Set permissions
        setPermissions({
          canAssignTraining: !!assignTraining,
          canModifyTraining: !!modifyTraining,
          canMarkSOPCritical: !!markSOPCritical,
          canEditSOP: !!editSOP,
        });

        // Determine role (highest role takes precedence)
        if (isOwner) {
          setUserRole("OWNER");
        } else if (isAdmin) {
          setUserRole("ADMIN");
        } else if (isSiteAdmin) {
          setUserRole("SITE_ADMIN");
        } else if (isSupervisor) {
          setUserRole("SUPERVISOR");
        } else if (isUser) {
          setUserRole("USER");
        } else {
          // Fallback to clientMetadata for backward compatibility
          setUserRole((user.clientMetadata?.role as string) || "USER");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        // Fallback to clientMetadata for backward compatibility
        setUserRole((user.clientMetadata?.role as string) || "USER");
      }
    };

    checkPermissions();
  }, [user]);

  return {
    ...permissions,
    userRole,
    userSiteId,
    isAuthenticated: !!user,
  };
}
