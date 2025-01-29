"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrainingStatus } from "@prisma/client";

type Training = {
  id: string;
  status: TrainingStatus;
  completedAt: Date | null;
  approvedAt: Date | null;
  notes: string | null;
  updatedAt: Date;
  sop: {
    name: string;
    version: string;
    description: string | null;
  };
  user: {
    name: string;
  };
  approvedBy: {
    name: string;
  } | null;
};

export default function TrainingPage() {
  const { data: session, status } = useSession();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TrainingStatus | "ALL">(
    "ALL"
  );
  const [sortBy, setSortBy] = useState<"status" | "date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }

    const fetchData = async () => {
      try {
        const response = await fetch("/api/trainings");
        const data = await response.json();
        setTrainings(data);
      } catch (error) {
        console.error("Failed to fetch trainings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchData();
    }
  }, [session, status]);

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
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Training Progress</h1>
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

      <div className="grid gap-6">
        {filteredAndSortedTrainings.map((training) => (
          <Card key={training.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{training.sop.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Version {training.sop.version}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      training.status === TrainingStatus.APPROVED
                        ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                        : training.status === TrainingStatus.COMPLETED
                        ? "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20"
                        : training.status === TrainingStatus.REJECTED
                        ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                        : "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20"
                    }`}
                  >
                    {training.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {training.sop.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {training.sop.description}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <dl className="space-y-1 text-sm">
                    <div>
                      <dt className="inline text-muted-foreground">Trainee:</dt>
                      <dd className="inline ml-1">{training.user.name}</dd>
                    </div>
                    {training.completedAt && (
                      <div>
                        <dt className="inline text-muted-foreground">
                          Completed:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(training.completedAt).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {training.approvedBy && (
                      <div>
                        <dt className="inline text-muted-foreground">
                          Approved by:
                        </dt>
                        <dd className="inline ml-1">
                          {training.approvedBy.name}
                        </dd>
                      </div>
                    )}
                    {training.approvedAt && (
                      <div>
                        <dt className="inline text-muted-foreground">
                          Approved on:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(training.approvedAt).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {training.notes && (
                      <div>
                        <dt className="inline text-muted-foreground">Notes:</dt>
                        <dd className="inline ml-1">{training.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Action buttons will be added here in a future update */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
