"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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
import { SignatureDialog } from "@/components/signature-dialog";
import { TrainingProgress, TrainingStatus } from "@prisma/client";

interface MultipleSignaturesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string;
}

type TrainingWithRelations = TrainingProgress & {
  user: { name: string; ssoId?: string };
  sop: { name: string; version: string };
};

export function MultipleSignaturesDialog({
  isOpen,
  onClose,
  siteId,
}: MultipleSignaturesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inProgressSOPs, setInProgressSOPs] = useState<{
    [sopId: string]: { name: string; version: string; count: number };
  }>({});
  const [selectedSopId, setSelectedSopId] = useState<string>("");
  const [trainingsToSign, setTrainingsToSign] = useState<
    TrainingWithRelations[]
  >([]);
  const [currentTrainingIndex, setCurrentTrainingIndex] = useState(0);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [completedSignatures, setCompletedSignatures] = useState<string[]>([]);
  const { data: session } = useSession();

  // Memoize the fetchInProgressSOPs function with useCallback
  const fetchInProgressSOPs = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = siteId
        ? `/api/sites/${siteId}/trainings?status=IN_PROGRESS`
        : `/api/trainings?status=IN_PROGRESS`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch trainings");
      }

      const trainings: TrainingWithRelations[] = await response.json();

      // Filter out admin users (users with "Admin" in their name)
      const filteredTrainings = trainings.filter(
        (training) => !training.user.name.includes("Admin")
      );

      // Group trainings by SOP ID and track unique users
      const sops: {
        [sopId: string]: {
          name: string;
          version: string;
          count: number;
          userIds: Set<string>; // Track unique users
        };
      } = {};

      filteredTrainings.forEach((training) => {
        if (!sops[training.sopId]) {
          sops[training.sopId] = {
            name: training.sop.name,
            version: training.sop.version,
            count: 0,
            userIds: new Set(),
          };
        }

        // Only count unique users
        if (!sops[training.sopId].userIds.has(training.userId)) {
          sops[training.sopId].userIds.add(training.userId);
          sops[training.sopId].count++;
        }
      });

      // Filter to only include SOPs with multiple unique users
      const filteredSops = Object.fromEntries(
        Object.entries(sops)
          .filter(([_, data]) => data.count > 1)
          .map(([id, data]) => [
            id,
            {
              name: data.name,
              version: data.version,
              count: data.count,
            },
          ])
      );

      setInProgressSOPs(filteredSops);
    } catch (error) {
      console.error("Error fetching in-progress SOPs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]); // Only recreate when siteId changes

  // Fetch in-progress SOPs when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchInProgressSOPs();
    } else {
      // Reset state when dialog closes
      setSelectedSopId("");
      setTrainingsToSign([]);
      setCurrentTrainingIndex(0);
      setCompletedSignatures([]);
    }
  }, [isOpen, fetchInProgressSOPs]); // fetchInProgressSOPs is now memoized

  // Memoize handleSopSelect for better performance
  const handleSopSelect = useCallback(
    async (sopId: string) => {
      setSelectedSopId(sopId);
      setIsLoading(true);

      try {
        const url = siteId
          ? `/api/sites/${siteId}/trainings?status=IN_PROGRESS&sopId=${sopId}`
          : `/api/trainings?status=IN_PROGRESS&sopId=${sopId}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch trainings for selected SOP");
        }

        const trainings: TrainingWithRelations[] = await response.json();

        // Filter out admin users (users with "Admin" in their name)
        const filteredTrainings = trainings.filter(
          (training) => !training.user.name.includes("Admin")
        );

        // Deduplicate trainings by user ID
        const uniqueTrainings = new Map<string, TrainingWithRelations>();
        filteredTrainings.forEach((training) => {
          if (!uniqueTrainings.has(training.userId)) {
            uniqueTrainings.set(training.userId, training);
          }
        });

        setTrainingsToSign(Array.from(uniqueTrainings.values()));
        setCurrentTrainingIndex(0);
        setCompletedSignatures([]);
      } catch (error) {
        console.error("Error fetching trainings for selected SOP:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [siteId]
  ); // Only recreate when siteId changes

  const startSignatureProcess = useCallback(() => {
    if (trainingsToSign.length > 0) {
      setIsSignDialogOpen(true);
    }
  }, [trainingsToSign]);

  const handleSignatureComplete = useCallback(
    async (data: {
      signatureData: string;
      trainingId: string;
      trainerName: string;
    }) => {
      try {
        // Import functions dynamically to avoid circular dependencies
        const { generateSignaturePDF } = await import("@/lib/pdf");
        const { uploadSignatureDocument } = await import(
          "@/lib/document-upload"
        );

        // Convert signature data URL to a Blob
        const base64Data = data.signatureData.split(",")[1];
        const signatureBlob = await fetch(
          `data:image/png;base64,${base64Data}`
        ).then((r) => r.blob());

        const currentTraining = trainingsToSign[currentTrainingIndex];

        // Generate a PDF with the signature
        const pdfBlob = await generateSignaturePDF(
          currentTraining,
          signatureBlob,
          data.trainerName
        );

        // Upload the signature document
        await uploadSignatureDocument(
          pdfBlob,
          currentTraining,
          data.trainingId
        );

        // Add to completed signatures - but don't try to update the training status
        setCompletedSignatures((prev) => [...prev, currentTraining.id]);

        // Move to next training or close if all are done
        if (currentTrainingIndex < trainingsToSign.length - 1) {
          setCurrentTrainingIndex((prev) => prev + 1);
          // Close the current dialog to reset the canvas for the next user
          setIsSignDialogOpen(false);
          // Reopen the dialog for the next user after a short delay
          setTimeout(() => {
            setIsSignDialogOpen(true);
          }, 100);
        } else {
          setIsSignDialogOpen(false);
        }
      } catch (error) {
        console.error("Error processing signature:", error);
        alert("Error saving signature. Please try again.");
      }
    },
    [currentTrainingIndex, trainingsToSign]
  );

  const getCurrentTraining = useCallback(() => {
    return trainingsToSign[currentTrainingIndex];
  }, [trainingsToSign, currentTrainingIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Capture Multiple Signatures</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select SOP with Multiple In-Progress Trainings:
                </label>
                <Select
                  value={selectedSopId}
                  onValueChange={handleSopSelect}
                  disabled={Object.keys(inProgressSOPs).length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a SOP" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(inProgressSOPs).length === 0 ? (
                      <SelectItem value="none" disabled>
                        No SOPs with multiple trainees found
                      </SelectItem>
                    ) : (
                      Object.entries(inProgressSOPs).map(([id, sop]) => (
                        <SelectItem key={id} value={id}>
                          {sop.name} (v{sop.version}) - {sop.count} trainees
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedSopId && trainingsToSign.length > 0 && (
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">
                      Trainees for {inProgressSOPs[selectedSopId]?.name} (v
                      {inProgressSOPs[selectedSopId]?.version})
                    </h3>
                    <ul className="space-y-2">
                      {trainingsToSign.map((training, index) => (
                        <li
                          key={training.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{index + 1}.</span>
                            <span>{training.user.name}</span>
                            {training.user.ssoId && (
                              <span className="text-sm text-muted-foreground">
                                (SSO: {training.user.ssoId})
                              </span>
                            )}
                          </div>
                          {completedSignatures.includes(training.id) && (
                            <span className="text-green-600 text-sm">
                              ✓ Signed
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    You will be prompted to sign for each trainee sequentially.
                    Each signature will be recorded individually.
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    {completedSignatures.length === trainingsToSign.length ? (
                      <Button type="button" onClick={onClose}>
                        Close
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={startSignatureProcess}
                        disabled={trainingsToSign.length === 0}
                      >
                        Start Signing Process
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {isSignDialogOpen && getCurrentTraining() && (
          <SignatureDialog
            isOpen={isSignDialogOpen}
            onClose={() => setIsSignDialogOpen(false)}
            onSubmit={handleSignatureComplete}
            training={getCurrentTraining()}
            title={`Sign Training for ${getCurrentTraining().user.name} (${
              currentTrainingIndex + 1
            } of ${trainingsToSign.length})`}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
