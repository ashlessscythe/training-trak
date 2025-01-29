import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PositionForm } from "./position-form";
import { Position } from "@prisma/client";

interface PositionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  position?: Position;
  title: string;
}

export function PositionDialog({
  isOpen,
  onClose,
  onSubmit,
  position,
  title,
}: PositionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <PositionForm
          onSubmit={onSubmit}
          position={position}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
