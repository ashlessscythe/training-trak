"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrainingProgress, TrainingStatus } from "@prisma/client";
import { TrainingDialog } from "@/components/training-dialog";

type TrainingWithRelations = TrainingProgress & {
  user: {
    name: string;
    siteId: string;
  };
  sop: {
    name: string;
    version: string;
    createdBy: {
      siteId: string;
    };
  };
  approvedBy: {
    name: string;
  } | null;
};

export default function SiteTrainingPage() {
  const params = useParams();
  const siteId = params.id as string;

  const [trainings, setTrainings] = useState<TrainingWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<
    TrainingWithRelations | undefined
  >();
  const [siteName, setSiteName] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrainingStatus | "ALL">(
    "ALL"
  );
  const [sortBy, setSortBy] = useState<"status" | "date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainingsRes, siteRes] = await Promise.all([
          fetch("/api/trainings").then((res) => res.json()),
          fetch(`/api/sites/${siteId}`).then((res) => res.json()),
        ]);

        // Filter trainings for this site
        const siteTrainings = trainingsRes.filter(
          (training: TrainingWithRelations) =>
            training.user.siteId === siteId ||
            training.sop.createdBy.siteId === siteId
        );

        setTrainings(siteTrainings);
        setSiteName(siteRes.name);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  const handleUpdateTraining = async (data: any) => {
    try {
      const response = await fetch("/api/trainings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update training");
      }

      const updatedTraining = await response.json();
      setTrainings((prev) =>
        prev.map((training) =>
          training.id === updatedTraining.id ? updatedTraining : training
        )
      );
      setIsDialogOpen(false);
      setSelectedTraining(undefined);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Helper function to get status badge color
  const getStatusColor = (status: TrainingStatus) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600";
      case "REJECTED":
        return "text-red-600";
      case "COMPLETED":
        return "text-blue-600";
      default:
        return "text-yellow-600";
    }
  };

  // Filter and sort trainings
  const filteredAndSortedTrainings = trainings
    .filter((training) =>
      statusFilter === "ALL" ? true : training.status === statusFilter
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "status":
          return sortOrder === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        case "date":
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        case "name":
          return sortOrder === "asc"
            ? a.sop.name.localeCompare(b.sop.name)
            : b.sop.name.localeCompare(a.sop.name);
        default:
          return 0;
      }
    });

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
        <h1 className="text-3xl font-bold">Training Progress - {siteName}</h1>
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as TrainingStatus | "ALL")
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
        {filteredAndSortedTrainings.map((training) => (
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
        {filteredAndSortedTrainings.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No training records found for this site.
          </p>
        )}
      </div>

      <TrainingDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedTraining(undefined);
        }}
        onSubmit={handleUpdateTraining}
        training={selectedTraining}
        title="Update Training Status"
      />
    </div>
  );
}
