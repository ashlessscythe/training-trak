"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrainingProgress, TrainingStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { getTrainingStatusText } from "@/lib/utils";

interface TrainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  training?: TrainingProgress & {
    user: { name: string };
    sop: { name: string; version: string };
  };
  title: string;
}

export function TrainingDialog({
  isOpen,
  onClose,
  onSubmit,
  training,
  title,
}: TrainingDialogProps) {
  const [status, setStatus] = useState<TrainingStatus>(
    training?.status || "IN_PROGRESS"
  );
  const [notes, setNotes] = useState(training?.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      id: training?.id,
      status,
      notes,
      ...(status === "COMPLETED" && { completedAt: new Date().toISOString() }),
    });
  };

  const statuses = Object.values(TrainingStatus);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={status}
              onValueChange={(value: TrainingStatus) => setStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {getTrainingStatusText(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this training record"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
