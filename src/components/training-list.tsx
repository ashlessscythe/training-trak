import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrainingStatus } from "@prisma/client";
import { TrainingDialog } from "@/components/training-dialog";
import { SignatureDialog } from "@/components/signature-dialog";
import { AssignTrainingDialog } from "@/components/assign-training-dialog";
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
import { jsPDF } from "jspdf";
// Note: We'll use a different approach for tables

interface TrainingListProps {
  siteId?: string;
  title?: string;
}

// Function to generate a PDF with the signature
const generateSignaturePDF = async (
  training: any,
  signatureBlob: Blob
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      if (!training) {
        reject(new Error("Training data is missing"));
        return;
      }

      // Create a new jsPDF instance
      const doc = new jsPDF();

      // Add Penske logo and header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("ISO Training System - Penske Training Record Sheet", 105, 15, {
        align: "center",
      });
      doc.setFontSize(12);
      doc.text("2.1", 105, 22, { align: "center" });

      // Add horizontal line
      doc.setLineWidth(0.5);
      doc.line(10, 25, 200, 25);

      // Draw tables manually instead of using autoTable
      // First table - Training info
      let yPos = 30;

      // Table headers
      doc.setFillColor(0, 0, 0);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.rect(10, yPos, 30, 10, "F");
      doc.text("DATE", 25, yPos + 6, { align: "center" });

      doc.rect(40, yPos, 30, 10, "F");
      doc.text("TRAINER", 55, yPos + 6, { align: "center" });

      doc.rect(70, yPos, 60, 10, "F");
      doc.text("COURSE NAME / SOP / TRAINING", 100, yPos + 6, {
        align: "center",
      });

      doc.rect(130, yPos, 30, 10, "F");
      doc.text("REV LEVEL", 145, yPos + 6, { align: "center" });

      doc.rect(160, yPos, 40, 10, "F");
      doc.text("APP. DATE", 180, yPos + 6, { align: "center" });

      // Table data
      yPos += 10;
      doc.setTextColor(0, 0, 0);

      // Draw cell borders
      doc.rect(10, yPos, 30, 10);
      doc.rect(40, yPos, 30, 10);
      doc.rect(70, yPos, 60, 10);
      doc.rect(130, yPos, 30, 10);
      doc.rect(160, yPos, 40, 10);

      // Add cell content
      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        25,
        yPos + 6,
        { align: "center" }
      );

      // Trainer cell is empty

      doc.text(`${training.sop.name}`, 100, yPos + 6, { align: "center" });

      doc.text(training.sop.version, 145, yPos + 6, { align: "center" });

      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        180,
        yPos + 6,
        { align: "center" }
      );

      // Second table - Employee info
      yPos += 20;

      // Table headers
      doc.setFillColor(0, 0, 0);
      doc.setTextColor(255, 255, 255);

      doc.rect(10, yPos, 30, 10, "F");
      doc.text("S.S.O NUMBER", 25, yPos + 6, { align: "center" });

      doc.rect(40, yPos, 40, 10, "F");
      doc.text("EMPLOYEE NAME", 60, yPos + 6, { align: "center" });

      doc.rect(80, yPos, 40, 10, "F");
      doc.text("EMPLOYEE SIGNATURE", 100, yPos + 6, { align: "center" });

      doc.rect(120, yPos, 40, 10, "F");
      doc.text("VALIDATION DUE", 140, yPos + 6, { align: "center" });

      doc.rect(160, yPos, 40, 10, "F");
      doc.text("ACTUAL VAL. DATE", 180, yPos + 6, { align: "center" });

      // Table data
      yPos += 10;
      doc.setTextColor(0, 0, 0);

      // Draw cell borders
      doc.rect(10, yPos, 30, 10);
      doc.rect(40, yPos, 40, 10);
      doc.rect(80, yPos, 40, 10);
      doc.rect(120, yPos, 40, 10);
      doc.rect(160, yPos, 40, 10);

      // Add cell content
      doc.text(training.user.ssoId || "", 25, yPos + 6, { align: "center" });

      doc.text(training.user.name, 60, yPos + 6, { align: "center" });

      // Convert signature blob to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const signatureDataUrl = reader.result as string;
        console.log(
          "Signature data URL in PDF generation:",
          signatureDataUrl.substring(0, 50) + "..."
        );

        // Position signature in the signature cell
        const signatureX = 100; // Center of signature cell
        const signatureY = yPos + 5; // Middle of the row
        const signatureWidth = 30;
        const signatureHeight = 8;

        doc.addImage(
          signatureDataUrl,
          "PNG",
          signatureX - signatureWidth / 2,
          signatureY - signatureHeight / 2,
          signatureWidth,
          signatureHeight
        );

        // Add validation due date
        doc.text(
          new Date(
            new Date().setDate(new Date().getDate() + 21)
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
          140,
          yPos + 6,
          { align: "center" }
        );

        // Actual validation date is empty

        // Add document ID and disclaimer
        yPos += 20;
        const docId = `${training.sop.name.replace(/\s+/g, "-")}-${
          training.sop.version
        }-${new Date().toISOString().split("T")[0]}`;
        doc.setFontSize(10);
        doc.text(docId, 105, yPos, { align: "center" });

        yPos += 10;
        doc.setFontSize(10);
        const disclaimer =
          "By signing this document, you acknowledge understanding and agreeing with the steps documented in the Procedure, Work Instructions or Training Module listed above.";
        const splitText = doc.splitTextToSize(disclaimer, 180);
        doc.text(splitText, 105, yPos, { align: "center" });

        // Add checkboxes section
        yPos += 20;

        // Table headers
        doc.setFillColor(200, 200, 200);
        doc.setTextColor(0, 0, 0);

        doc.rect(10, yPos, 40, 10, "F");
        doc.text("QR Code", 30, yPos + 6, { align: "center" });

        doc.rect(50, yPos, 50, 10, "F");
        doc.text("DEMONSTRATION OF TASK", 75, yPos + 6, { align: "center" });

        doc.rect(100, yPos, 50, 10, "F");
        doc.text("EXAMINATION", 125, yPos + 6, { align: "center" });

        doc.rect(150, yPos, 50, 10, "F");
        doc.text("OTHER", 175, yPos + 6, { align: "center" });

        // Table data
        yPos += 10;

        // Draw cell borders
        doc.rect(10, yPos, 40, 20);
        doc.rect(50, yPos, 50, 20);
        doc.rect(100, yPos, 50, 20);
        doc.rect(150, yPos, 50, 20);

        // Add cell content
        doc.setFontSize(8);

        doc.text("(Witness must initial on completion)", 75, yPos + 10, {
          align: "center",
        });

        doc.text("(Attach examination)", 125, yPos + 10, { align: "center" });

        doc.text("(Explain):", 175, yPos + 10, { align: "center" });

        // Generate PDF blob
        const pdfBlob = doc.output("blob");
        resolve(pdfBlob);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsDataURL(signatureBlob);
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(error);
    }
  });
};

export function TrainingList({
  siteId,
  title = "Training Progress",
}: TrainingListProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
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
          {canAssignTraining && (
            <Button
              onClick={() => setIsAssignDialogOpen(true)}
              className="mb-4"
            >
              Assign Training
            </Button>
          )}
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
            // Create a form data object to send the signature
            const formData = new FormData();

            // Convert signature data URL to a Blob
            // Parse the data URL properly
            const base64Data = data.signatureData.split(",")[1];
            const signatureBlob = await fetch(
              `data:image/png;base64,${base64Data}`
            ).then((r) => r.blob());

            // Generate a PDF with the signature
            const pdfBlob = await generateSignaturePDF(
              selectedTraining,
              signatureBlob
            );

            // Create a File object from the PDF blob
            const pdfFile = new File(
              [pdfBlob],
              `training-signature-${selectedTraining?.sop.name.replace(
                /\s+/g,
                "-"
              )}-${new Date().toISOString().split("T")[0]}.pdf`,
              { type: "application/pdf" }
            );

            // Add the file to the form data
            formData.append("content", pdfFile);
            formData.append("type", "SIGNATURE_SHEET");
            formData.append(
              "metadata",
              JSON.stringify({
                description: `Training signature for ${selectedTraining?.sop.name} (v${selectedTraining?.sop.version})`,
                category: "Training",
                tags: ["signature", "training", selectedTraining?.sop.name],
                version: "1.0",
                trainingId: data.trainingId,
              })
            );

            if (selectedTraining?.sopId) {
              formData.append("sopId", selectedTraining.sopId);
            }

            // Send the form data to the documents API
            const response = await fetch("/api/documents", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              throw new Error("Failed to save signature document");
            }

            setIsSignDialogOpen(false);
            setSelectedTraining(undefined);

            // Show success message
            alert("Signature saved successfully");
          } catch (error) {
            console.error("Error saving signature:", error);
            alert("Error saving signature. Please try again.");
          }
        }}
        training={selectedTraining}
        title="Sign Training Document"
      />
    </div>
  );
}
