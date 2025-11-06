import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Site, User, Department, Position } from "@prisma/client";
import { UserForm } from "./user-form";
import { useState } from "react";

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  sites: Site[];
  departments: Department[];
  positions: Position[];
  user?: User;
  title: string;
}

export function UserDialog({
  isOpen,
  onClose,
  onSubmit,
  sites,
  departments: initialDepartments,
  positions: initialPositions,
  user,
  title,
}: UserDialogProps) {
  const [departments, setDepartments] =
    useState<Department[]>(initialDepartments);
  const [positions, setPositions] = useState<Position[]>(initialPositions);

  // Function to fetch departments and positions for a selected site
  const handleSiteChange = async (siteId: string) => {
    try {
      const [departmentsRes, positionsRes] = await Promise.all([
        fetch(`/api/sites/${siteId}/departments`).then((res) => res.json()),
        fetch(`/api/sites/${siteId}/positions`).then((res) => res.json()),
      ]);

      setDepartments(departmentsRes);
      setPositions(positionsRes);
    } catch (error) {
      console.error("Failed to fetch data for site:", error);
    }
  };

  // Transform user data to match the expected format for UserForm
  const transformedUserData = user
    ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        siteId: user.siteId,
        departmentId: user.departmentId,
        positionId: user.positionId,
        isActive: user.isActive,
        shift: user.shift ? user.shift.toString() : undefined,
        ssoId: user.ssoId || undefined,
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <UserForm
          sites={sites}
          departments={departments}
          positions={positions}
          onSubmit={onSubmit}
          initialData={transformedUserData}
          onCancel={onClose}
          onSiteChange={handleSiteChange}
        />
      </DialogContent>
    </Dialog>
  );
}
