import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Site, User } from "@prisma/client";
import { UserForm } from "./user-form";

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  sites: Site[];
  user?: User;
  title: string;
}

export function UserDialog({
  isOpen,
  onClose,
  onSubmit,
  sites,
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
          onSubmit={onSubmit}
          initialData={user}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
