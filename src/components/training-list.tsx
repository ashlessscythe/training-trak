import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrainingStatus } from "@prisma/client";
import { TrainingDialog } from "@/components/training-dialog";
import { SignatureDialog } from "@/components/signature-dialog";
import { AssignTrainingDialog } from "@/components/assign-training-dialog";
import { MultipleSignaturesDialog } from "@/components/multiple-signatures-dialog";
import { TrainingViewSelector } from "@/components/training-view-selector";
import { useUserPermissions } from "@/hooks/useUserPermissions";
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
import { ChevronRight, ChevronDown } from "lucide-react";
import { ListView } from "@/components/list-view";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { useListView } from "@/hooks/useListView";
import { generateSignaturePDF } from "@/lib/pdf";
import { uploadSignatureDocument } from "@/lib/document-upload";

interface TrainingListProps {
  siteId?: string;
  title?: string;
}

export function TrainingList({
  siteId,
  title = "Training Progress",
}: TrainingListProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [isMultipleSignDialogOpen, setIsMultipleSignDialogOpen] =
    useState(false);
  const {
    trainings,
    groupedTrainings,
    viewType,
    setViewType,
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

  const { viewMode, setViewMode, currentView } = useListView();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const { canAssignTraining } = useUserPermissions();

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
      accessor: (groupName: string) => groupedTrainings[groupName].length,
      className: "w-24",
    },
    {
      header: "Progress",
      accessor: (groupName: string) => {
        const trainings = groupedTrainings[groupName];
        const completed = trainings.filter(
          (t) => t.status === "COMPLETED"
        ).length;
        const total = trainings.length;
        return (
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {completed}/{total}
            </span>
          </div>
        );
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
        <span className={`font-medium ${getStatusColor(training.status)}`}>
          {getTrainingStatusText(training.status)}
        </span>
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
    {
      header: "Actions",
      accessor: (training: any) => (
        <div className="flex gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTraining(training);
              setIsSignDialogOpen(true);
            }}
          >
            Sign Training
          </Button>
        </div>
      ),
      className: "w-64",
    },
  ];

  const renderCard = (training: any) => (
    <Card key={training.id} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {training.sop.name} v{training.sop.version}
        </h3>
        <div className="flex flex-col gap-2">
          <span className={`font-medium ${getStatusColor(training.status)}`}>
            {getTrainingStatusText(training.status)}
          </span>
          <div className="flex gap-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTraining(training);
                setIsSignDialogOpen(true);
              }}
            >
              Sign Training
            </Button>
          </div>
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
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex items-center gap-4">
          <TrainingViewSelector value={viewType} onChange={setViewType} />
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <div className="flex gap-2">
            {canAssignTraining && (
              <Button
                onClick={() => setIsAssignDialogOpen(true)}
                className="mb-4"
              >
                Assign Training
              </Button>
            )}
            <Button
              onClick={() => setIsMultipleSignDialogOpen(true)}
              className="mb-4"
              variant="outline"
            >
              Capture Multiple Signatures
            </Button>
          </div>
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
                  <React.Fragment key={`group-${groupName}`}>
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
                              emptyMessage="No training records found."
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssignTrainingDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        onSubmit={async (data) => {
          try {
            const response = await fetch(`/api/sites/${siteId}/trainings`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              throw new Error("Failed to assign training");
            }

            setIsAssignDialogOpen(false);
            fetchTrainings();
          } catch (error) {
            console.error("Error assigning training:", error);
          }
        }}
        siteId={siteId || ""}
      />

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

      <SignatureDialog
        isOpen={isSignDialogOpen}
        onClose={() => {
          setIsSignDialogOpen(false);
          setSelectedTraining(undefined);
        }}
        onSubmit={async (data) => {
          try {
            // Convert signature data URL to a Blob
            const base64Data = data.signatureData.split(",")[1];
            const signatureBlob = await fetch(
              `data:image/png;base64,${base64Data}`
            ).then((r) => r.blob());

            if (!selectedTraining) {
              throw new Error("Training data is missing");
            }

            // Generate a PDF with the signature
            const pdfBlob = await generateSignaturePDF(
              selectedTraining,
              signatureBlob,
              data.trainerName
            );

            // Upload the signature document
            await uploadSignatureDocument(
              pdfBlob,
              selectedTraining,
              data.trainingId
            );

            setIsSignDialogOpen(false);
            setSelectedTraining(undefined);

            // Show success message
            alert("Signature saved successfully");

            // Refresh the training list
            fetchTrainings();
          } catch (error) {
            console.error("Error saving signature:", error);
            alert("Error saving signature. Please try again.");
          }
        }}
        training={selectedTraining}
        title="Sign Training Document"
      />

      <MultipleSignaturesDialog
        isOpen={isMultipleSignDialogOpen}
        onClose={() => {
          setIsMultipleSignDialogOpen(false);
          fetchTrainings(); // Refresh the training list after capturing signatures
        }}
        siteId={siteId}
      />
    </div>
  );
}
