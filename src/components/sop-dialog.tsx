"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SOP } from "@prisma/client";
import { SOPForm } from "./sop-form";

interface SOPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  sop?: SOP;
  title: string;
}

export function SOPDialog({
  isOpen,
  onClose,
  onSubmit,
  sop,
  title,
}: SOPDialogProps) {
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
                  isActive: sop.isActive,
                }
              : undefined
          }
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
