"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SOP, Document } from "@prisma/client";
import { DocumentForm } from "./document-form";

interface DocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  sops: SOP[];
  document?: Document;
  title: string;
}

export function DocumentDialog({
  isOpen,
  onClose,
  onSubmit,
  sops,
  document,
  title,
}: DocumentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DocumentForm
          sops={sops}
          onSubmit={onSubmit}
          initialData={
            document
              ? {
                  id: document.id,
                  name: document.name,
                  type: document.type,
                  url: document.url,
                  metadata: document.metadata,
                  sopId: document.sopId || undefined,
                }
              : undefined
          }
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
