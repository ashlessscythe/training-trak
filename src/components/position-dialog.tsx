import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PositionForm } from "./position-form";
import { Position, SOP } from "@prisma/client";
import { useParams } from "next/navigation";
import { useAvailableSOPs } from "@/hooks/useAvailableSOPs";

interface PositionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  position?: Position & { sops?: SOP[] };
  title: string;
}

export function PositionDialog({
  isOpen,
  onClose,
  onSubmit,
  position,
  title,
}: PositionDialogProps) {
  const params = useParams();
  const siteId = params.id as string;
  const { sops, isLoading } = useAvailableSOPs({ siteId });
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
          availableSops={sops}
        />
      </DialogContent>
    </Dialog>
  );
}
