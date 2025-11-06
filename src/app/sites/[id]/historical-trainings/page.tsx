"use client";

import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TrainingStatus } from "@prisma/client";
import { TrainingViewSelector } from "@/components/features/trainings/training-view-selector";
import { getTrainingStatusText } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTraining } from "@/hooks/useTraining";
import React, { useEffect, useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle,
  FileSignature,
  ArrowLeft,
} from "lucide-react";
import { ListView } from "@/components/list-view";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { useListView } from "@/hooks/useListView";

export default function HistoricalTrainingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const {
    completedAndSignedTrainings,
    viewType,
    setViewType,
    isLoading,
    filters,
    sortBy,
    sortOrder,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchTrainings,
    getStatusColor,
  } = useTraining({ siteId: id });

  const { viewMode, setViewMode } = useListView();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Group trainings by date when viewType is 'date'
  const groupedTrainings = useMemo(() => {
    if (viewType === "date") {
      return completedAndSignedTrainings.reduce((acc, training) => {
        if (!training.completedAt) return acc;

        // Format the date as YYYY-MM-DD
        const dateStr = new Date(training.completedAt)
          .toISOString()
          .split("T")[0];

        // Use a more readable format for display
        const displayDate = new Date(training.completedAt).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        );

        if (!acc[displayDate]) {
          acc[displayDate] = [];
        }
        acc[displayDate].push(training);
        return acc;
      }, {} as Record<string, typeof completedAndSignedTrainings>);
    } else {
      // Use the existing grouping logic from useTraining hook
      switch (viewType) {
        case "user":
          return completedAndSignedTrainings.reduce((acc, training) => {
            const userName = training.user.name;
            if (!acc[userName]) {
              acc[userName] = [];
            }
            acc[userName].push(training);
            return acc;
          }, {} as Record<string, typeof completedAndSignedTrainings>);
        case "department":
          return completedAndSignedTrainings.reduce((acc, training) => {
            const deptName = training.user.department?.name || "No Department";
            if (!acc[deptName]) {
              acc[deptName] = [];
            }
            acc[deptName].push(training);
            return acc;
          }, {} as Record<string, typeof completedAndSignedTrainings>);
        case "sop":
        default:
          return completedAndSignedTrainings.reduce((acc, training) => {
            const sopName = training.sop.name;
            if (!acc[sopName]) {
              acc[sopName] = [];
            }
            acc[sopName].push(training);
            return acc;
          }, {} as Record<string, typeof completedAndSignedTrainings>);
      }
    }
  }, [completedAndSignedTrainings, viewType]);

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

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((name) => name !== groupName)
        : [...prev, groupName]
    );
  };

  const parentColumns = [
    {
      header:
        viewType === "user"
          ? "User"
          : viewType === "department"
          ? "Department"
          : viewType === "date"
          ? "Completion Date"
          : "SOP",
      accessor: (groupName: string) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleGroup(groupName);
            }}
          >
            {expandedGroups.includes(groupName) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <span className="font-medium">{groupName}</span>
        </div>
      ),
    },
    {
      header: "Count",
      accessor: (groupName: string) => {
        return groupedTrainings[groupName]?.length || 0;
      },
      className: "w-24",
    },
    {
      header: viewType === "date" ? "Latest Training" : "Completion Date",
      accessor: (groupName: string) => {
        const trainings = groupedTrainings[groupName] || [];
        if (trainings.length === 0) return "N/A";

        // Find the most recent completion date
        const mostRecentDate = trainings.reduce((latest, training) => {
          if (!training.completedAt) return latest;
          const completedDate = new Date(training.completedAt);
          return !latest || completedDate > latest ? completedDate : latest;
        }, null as Date | null);

        return mostRecentDate ? mostRecentDate.toLocaleDateString() : "N/A";
      },
      className: "w-48",
    },
  ];

  const childColumns = [
    {
      header: "SOP",
      accessor: (training: any) => (
        <div>
          <div className="font-medium">{training.sop.name}</div>
          <div className="text-sm text-muted-foreground">
            v{training.sop.version}
          </div>
        </div>
      ),
    },
    {
      header: "Trainee",
      accessor: (training: any) => training.user.name,
    },
    {
      header: "Status",
      accessor: (training: any) => (
        <div className="flex items-center gap-2">
          {training.status === TrainingStatus.COMPLETED && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {training.isSigned && (
            <FileSignature className="h-4 w-4 text-blue-500" />
          )}
          <span
            className={`font-medium ${getStatusColor(
              training.status,
              training.isSigned
            )}`}
          >
            {getTrainingStatusText(training.status, training.isSigned)}
          </span>
        </div>
      ),
      className: "w-32",
    },
    {
      header: "Completion",
      accessor: (training: any) => (
        <div>
          {training.completedAt && (
            <div>
              <div>Completed on:</div>
              <div className="text-sm text-muted-foreground">
                {new Date(training.completedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      ),
      className: "w-48",
    },
  ];

  const renderCard = (training: any) => (
    <Card key={training.id} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {training.sop.name} v{training.sop.version}
        </h3>
        <div className="flex items-center gap-2">
          {training.status === TrainingStatus.COMPLETED && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {training.isSigned && (
            <FileSignature className="h-4 w-4 text-blue-500" />
          )}
          <span
            className={`font-medium ${getStatusColor(
              training.status,
              training.isSigned
            )}`}
          >
            {getTrainingStatusText(training.status, training.isSigned)}
          </span>
        </div>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Trainee: {training.user.name}</p>
        {training.completedAt && (
          <p>
            Completed: {new Date(training.completedAt).toLocaleDateString()}
          </p>
        )}
        {training.notes && <p>Notes: {training.notes}</p>}
      </div>
    </Card>
  );

  const statuses = Object.values(TrainingStatus);
  const displayName = (str: string) => {
    return str.replace("_", " ");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => router.push(`/sites/${id}/training`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Training
          </Button>
          <h1 className="text-3xl font-bold">Historical Trainings</h1>
        </div>
        <div className="flex items-center gap-4">
          <TrainingViewSelector
            value={viewType}
            onChange={setViewType}
            showDateOption={true}
          />
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
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
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {displayName(s)}
                </SelectItem>
              ))}
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

      {/* Status Legend */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm">Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <FileSignature className="h-4 w-4 text-blue-500" />
          <span className="text-sm">Signed</span>
        </div>
      </div>

      {/* Completed Trainings Section */}
      <div className="mb-8">
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {parentColumns.map((column, index) => (
                    <th
                      key={index}
                      className={`px-4 py-3 text-left text-sm font-medium ${
                        column.className || ""
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedTrainings).map(
                  ([groupName, groupTrainings]) => (
                    <React.Fragment key={`training-group-${groupName}`}>
                      <tr
                        key={groupName}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleGroup(groupName)}
                      >
                        {parentColumns.map((column, index) => (
                          <td
                            key={index}
                            className={`px-4 py-3 ${column.className || ""}`}
                          >
                            {column.accessor(groupName)}
                          </td>
                        ))}
                      </tr>
                      {expandedGroups.includes(groupName) && (
                        <tr>
                          <td colSpan={parentColumns.length} className="p-0">
                            <div className="border-l-2 border-l-primary/20 ml-3">
                              <ListView
                                data={groupTrainings}
                                columns={childColumns}
                                view="table"
                                renderCard={renderCard}
                                keyExtractor={(training) => training.id}
                                emptyMessage="No completed training records found."
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                )}
                {Object.keys(groupedTrainings).length === 0 && (
                  <tr>
                    <td
                      colSpan={parentColumns.length}
                      className="p-4 text-center"
                    >
                      No completed and signed training records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
