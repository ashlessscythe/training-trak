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
          initialData={user}
          onCancel={onClose}
          onSiteChange={handleSiteChange}
        />
      </DialogContent>
    </Dialog>
  );
}
