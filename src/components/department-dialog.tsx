import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DepartmentForm } from "./department-form";
import { Department } from "@prisma/client";

interface DepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  department?: Department;
  title: string;
  siteId?: string;
}

export function DepartmentDialog({
  isOpen,
  onClose,
  onSubmit,
  department,
  title,
  siteId,
}: DepartmentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DepartmentForm
          onSubmit={onSubmit}
          department={department}
          onCancel={onClose}
          siteId={siteId}
        />
      </DialogContent>
    </Dialog>
  );
}
