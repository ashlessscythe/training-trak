"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Site } from "@prisma/client";
import { SiteForm } from "./site-form";

interface SiteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  site?: Site;
  title: string;
}

export function SiteDialog({
  isOpen,
  onClose,
  onSubmit,
  site,
  title,
}: SiteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <SiteForm
          onSubmit={onSubmit}
          initialData={
            site
              ? {
                  id: site.id,
                  code: site.code,
                  name: site.name,
                  description: site.description || undefined,
                  isActive: site.isActive,
                }
              : undefined
          }
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
