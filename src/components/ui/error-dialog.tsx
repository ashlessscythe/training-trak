"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  error: string | Error;
}

export function ErrorDialog({
  isOpen,
  onClose,
  title = "Error",
  error,
}: ErrorDialogProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-destructive text-sm mt-2">
            {errorMessage}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 