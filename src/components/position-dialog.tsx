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
  siteId?: string; // Make siteId optional prop
}

export function PositionDialog({
  isOpen,
  onClose,
  onSubmit,
  position,
  title,
  siteId: propSiteId, // Rename to avoid conflict
}: PositionDialogProps) {
  const params = useParams();
  // Use the prop siteId if provided, otherwise try to get it from URL params
  const siteId = propSiteId || (params?.id as string);
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
