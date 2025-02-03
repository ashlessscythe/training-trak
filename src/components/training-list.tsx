import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrainingStatus } from "@prisma/client";
import { TrainingDialog } from "@/components/training-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTraining } from "@/hooks/useTraining";
import { useEffect } from "react";

interface TrainingListProps {
  siteId?: string;
  title?: string;
}

export function TrainingList({
  siteId,
  title = "Training Progress",
}: TrainingListProps) {
  const {
    trainings,
    isLoading,
    isDialogOpen,
    selectedTraining,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedTraining,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchTrainings,
    handleUpdate,
    getStatusColor,
  } = useTraining({ siteId });

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex gap-4">
          <Select
            value={filters.status || "ALL"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                status: value as TrainingStatus | "ALL",
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as "status" | "date" | "name")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Modified</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="name">SOP Name</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {trainings.map((training) => (
          <Card key={training.id} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {training.sop.name} v{training.sop.version}
              </h3>
              <div className="flex items-center gap-4">
                <span
                  className={`font-medium ${getStatusColor(training.status)}`}
                >
                  {training.status.replace("_", " ")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTraining(training);
                    setIsDialogOpen(true);
                  }}
                >
                  Update Status
                </Button>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Trainee: {training.user.name}</p>
              {training.completedAt && (
                <p>
                  Completed:{" "}
                  {new Date(training.completedAt).toLocaleDateString()}
                </p>
              )}
              {training.approvedBy && (
                <p>
                  Approved by: {training.approvedBy.name} on{" "}
                  {new Date(training.approvedAt!).toLocaleDateString()}
                </p>
              )}
              {training.notes && <p>Notes: {training.notes}</p>}
            </div>
          </Card>
        ))}
        {trainings.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No training records found.
          </p>
        )}
      </div>

      <TrainingDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedTraining(undefined);
        }}
        onSubmit={handleUpdate}
        training={selectedTraining}
        title="Update Training Status"
      />
    </div>
  );
}
