import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Site, User, Department, Position } from "@prisma/client";
import { UserForm } from "./user-form";

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
  departments,
  positions,
  user,
  title,
}: UserDialogProps) {
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
        />
      </DialogContent>
    </Dialog>
  );
}
