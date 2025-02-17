"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { useAvailableSOPs } from "@/hooks/useAvailableSOPs";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";
import { useTraining } from "@/hooks/useTraining";
import { User, SOP } from "@prisma/client";
import type { TrainingWithRelations } from "@/hooks/useTraining";

interface AssignTrainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { userId: string; sopIds: string[] }) => Promise<void>;
  siteId: string;
}

export function AssignTrainingDialog({
  isOpen,
  onClose,
  onSubmit,
  siteId,
}: AssignTrainingDialogProps) {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedSOPs, setSelectedSOPs] = useState<string[]>([]);
  const { sops, isLoading: sopsLoading } = useAvailableSOPs({ siteId });
  const { users, isLoading: usersLoading } = useAvailableUsers({ siteId });
  const { trainings, isLoading: trainingsLoading, fetchTrainings } = useTraining({ 
    siteId,
    userId: selectedUser || undefined 
  });

  // Refetch trainings when user changes
  useEffect(() => {
    if (selectedUser) {
      fetchTrainings();
    }
  }, [selectedUser, fetchTrainings]);

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
  };
  const assignedSOPs = useMemo(() => {
    if (!selectedUser) return new Set<string>();
    const assigned = new Set(
      trainings
        .filter(t => t.userId === selectedUser && t.status !== "REJECTED")
        .map(t => t.sopId)
    );
    console.log('Assigned SOPs:', Array.from(assigned));
    return assigned;
  }, [selectedUser, trainings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || selectedSOPs.length === 0) return;
    
    await onSubmit({
      userId: selectedUser,
      sopIds: selectedSOPs,
    });
    
    // Reset form
    setSelectedUser("");
    setSelectedSOPs([]);
  };

  const toggleSOP = (sopId: string) => {
    // Don't allow toggling already assigned SOPs
    if (assignedSOPs.has(sopId)) return;
    
    setSelectedSOPs((current) =>
      current.includes(sopId)
        ? current.filter((id) => id !== sopId)
        : [...current, sopId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Training</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {(usersLoading || sopsLoading || trainingsLoading) ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium">User</label>
            <Select
              value={selectedUser}
              onValueChange={handleUserChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">SOPs</label>
            <div className="space-y-2">
              {sops?.map((sop) => (
                <div key={sop.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={sop.id}
                    checked={selectedSOPs.includes(sop.id)}
                    onChange={() => toggleSOP(sop.id)}
                    className={`h-4 w-4 rounded border-gray-300 ${
                      assignedSOPs.has(sop.id) 
                        ? 'opacity-50 cursor-not-allowed bg-muted' 
                        : ''
                    }`}
                    disabled={assignedSOPs.has(sop.id)}
                  />
                  <label 
                    htmlFor={sop.id} 
                    className={`text-sm flex items-center gap-2 ${
                      assignedSOPs.has(sop.id) 
                        ? 'text-muted-foreground bg-muted/30 p-1 rounded-md w-full' 
                        : ''
                    }`}
                  >
                    {sop.name} (v{sop.version})
                    {assignedSOPs.has(sop.id) && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full ml-auto">
                        Already assigned
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
              </div>

              <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!selectedUser || selectedSOPs.length === 0}
            >
              Assign
            </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
