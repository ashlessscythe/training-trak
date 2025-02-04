"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Position, SOP } from "@prisma/client";
import { useParams } from "next/navigation";
import { useAvailablePositions } from "@/hooks/useAvailablePositions";
import { SOPForm } from "./sop-form";

interface SOPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  sop?: SOP & { positions?: Position[] };
  title: string;
}

export function SOPDialog({
  isOpen,
  onClose,
  onSubmit,
  sop,
  title,
}: SOPDialogProps) {
  const params = useParams();
  const siteId = params.id as string;
  const { positions, isLoading } = useAvailablePositions(siteId);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <SOPForm
          onSubmit={onSubmit}
          initialData={
            sop
              ? {
                  id: sop.id,
                  name: sop.name,
                  description: sop.description || undefined,
                  version: sop.version,
                  content: sop.content || undefined,
                  requiredRoles: sop.requiredRoles,
                  positions: sop.positions || [],
                  isActive: sop.isActive,
                }
              : undefined
          }
          availablePositions={positions}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
