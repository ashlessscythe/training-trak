import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { useMemo } from "react";

export function useUserPermissions() {
  const { data: session } = useSession();

  const userRole = session?.user?.role as Role | undefined;
  const userSiteId = session?.user?.site?.id;

  const permissions = useMemo(() => {
    // Default permissions
    const perms = {
      canAssignTraining: false,
      canModifyTraining: false,
      canMarkSOPCritical: false,
      canEditSOP: false,
    };

    if (!userRole) return perms;

    // OWNER and ADMIN can do everything
    if (userRole === "OWNER" || userRole === "ADMIN") {
      perms.canAssignTraining = true;
      perms.canModifyTraining = true;
      perms.canMarkSOPCritical = true;
      perms.canEditSOP = true;
      return perms;
    }

    // SITE_ADMIN can assign and modify training, and mark SOPs as critical
    if (userRole === "SITE_ADMIN") {
      perms.canAssignTraining = true;
      perms.canModifyTraining = true;
      perms.canMarkSOPCritical = true;
      perms.canEditSOP = true;
      return perms;
    }

    // SUPERVISOR can modify training but not assign it, and can't edit SOPs or mark them as critical
    if (userRole === "SUPERVISOR") {
      perms.canAssignTraining = false; // Supervisors can't assign training
      perms.canModifyTraining = true;
      perms.canMarkSOPCritical = false; // Supervisors can't mark SOPs as critical
      perms.canEditSOP = false; // Supervisors can't edit SOPs
      return perms;
    }

    // USER and PENDING have no special permissions
    return perms;
  }, [userRole]);

  return {
    ...permissions,
    userRole,
    userSiteId,
    isAuthenticated: !!session?.user,
  };
}
