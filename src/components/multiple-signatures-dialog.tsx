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
  const [signatures, setSignatures] = useState<Map<string, Blob>>(new Map());
  const [isGeneratingMultiSig, setIsGeneratingMultiSig] = useState(false);
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);
  const { data: session } = useSession();

  // Memoize the fetchInProgressSOPs function with useCallback
  const fetchInProgressSOPs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch trainings that are in progress or signed
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
      // Reset submission state when dialog opens
      setIsSubmissionComplete(false);
    } else {
      // Reset state when dialog closes
      setSelectedSopId("");
      setTrainingsToSign([]);
      setCurrentTrainingIndex(0);
      setCompletedSignatures([]);
      setSignatures(new Map());
      setIsGeneratingMultiSig(false);
      setIsSubmissionComplete(false);
    }
  }, [isOpen, fetchInProgressSOPs]); // fetchInProgressSOPs is now memoized

  // Memoize handleSopSelect for better performance
  const handleSopSelect = useCallback(
    async (sopId: string) => {
      setSelectedSopId(sopId);
      setIsLoading(true);
      setIsSubmissionComplete(false);

      try {
        // Fetch trainings that are in progress for the selected SOP
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
        setSignatures(new Map());
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

  // Convert generateIndividualPDFs to useCallback and move it before generateAndUploadMultiSignaturePDF
  const generateIndividualPDFs = useCallback(
    async (trainerName: string) => {
      try {
        // Import functions dynamically to avoid circular dependencies
        const { generateSignaturePDF } = await import("@/lib/pdf");
        const { uploadSignatureDocument } = await import(
          "@/lib/document-upload"
        );

        // Generate and upload individual PDFs for each trainee
        for (const training of trainingsToSign) {
          const signatureBlob = signatures.get(training.id);
          if (signatureBlob) {
            const pdfBlob = await generateSignaturePDF(
              training,
              signatureBlob,
              trainerName
            );
            await uploadSignatureDocument(pdfBlob, training, training.id);
          }
        }
      } catch (error) {
        console.error("Error generating individual PDFs:", error);
      }
    },
    [trainingsToSign, signatures]
  );

  // Helper function that takes the updated signatures array directly
  const generateMultiSignaturePDFWithSignatures = useCallback(
    async (trainerName: string, updatedSignatures: string[]) => {
      // Check if we have all signatures
      if (updatedSignatures.length !== trainingsToSign.length) {
        console.error(
          `Not all signatures collected: ${updatedSignatures.length} of ${trainingsToSign.length}`
        );
        return;
      }

      setIsGeneratingMultiSig(true);
      setIsSubmissionComplete(false);
      try {
        // Import functions dynamically to avoid circular dependencies
        const { generateMultiSignaturePDF } = await import("@/lib/pdf");
        const { uploadMultiSignatureDocument } = await import(
          "@/lib/document-upload"
        );

        // Generate a PDF with all signatures
        const pdfBlob = await generateMultiSignaturePDF(
          trainingsToSign,
          signatures,
          trainerName
        );

        // Upload the multi-signature document
        await uploadMultiSignatureDocument(
          pdfBlob,
          trainingsToSign,
          trainingsToSign.map((t) => t.id)
        );

        // Mark all trainings as signed
        for (const training of trainingsToSign) {
          await fetch("/api/trainings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: training.id,
              isSigned: true,
              notes: `Signed by ${trainerName} on ${new Date().toLocaleDateString()} (multi-signature process)`,
            }),
          });
        }

        // Mark submission as complete
        setIsSubmissionComplete(true);
      } catch (error) {
        console.error("Error generating multi-signature PDF:", error);
        alert("Error generating multi-signature document. Please try again.");
      } finally {
        setIsGeneratingMultiSig(false);
      }
    },
    [signatures, trainingsToSign]
  );

  // Original function that uses the state directly - keep for the Submit button
  const generateAndUploadMultiSignaturePDF = useCallback(
    async (trainerName: string) => {
      // Use the helper function with the current state
      await generateMultiSignaturePDFWithSignatures(
        trainerName,
        completedSignatures
      );
    },
    [completedSignatures, generateMultiSignaturePDFWithSignatures]
  );

  const handleSignatureComplete = useCallback(
    async (data: {
      signatureData: string;
      trainingId: string;
      trainerName: string;
    }) => {
      try {
        // Convert signature data URL to a Blob
        const base64Data = data.signatureData.split(",")[1];
        const signatureBlob = await fetch(
          `data:image/png;base64,${base64Data}`
        ).then((r) => r.blob());

        const currentTraining = trainingsToSign[currentTrainingIndex];

        // Store the signature blob in the signatures Map
        const newSignatures = new Map(signatures);
        newSignatures.set(currentTraining.id, signatureBlob);
        setSignatures(newSignatures);

        // Add to completed signatures and store in a local variable to use immediately
        const updatedCompletedSignatures = [
          ...completedSignatures,
          currentTraining.id,
        ];
        setCompletedSignatures(updatedCompletedSignatures);

        // Move to next training or close dialog if all are done
        if (currentTrainingIndex < trainingsToSign.length - 1) {
          setCurrentTrainingIndex((prev) => prev + 1);
          // Close the current dialog to reset the canvas for the next user
          setIsSignDialogOpen(false);
          // Reopen the dialog for the next user after a short delay
          setTimeout(() => {
            setIsSignDialogOpen(true);
          }, 100);
        } else {
          // All signatures collected, close the dialog
          setIsSignDialogOpen(false);
          // Do NOT automatically generate PDF here - wait for user to click Submit
        }
      } catch (error) {
        console.error("Error processing signature:", error);
        alert("Error saving signature. Please try again.");
      }
    },
    [currentTrainingIndex, trainingsToSign, signatures, completedSignatures]
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
          {isLoading || isGeneratingMultiSig ? (
            <div className="text-center py-4">
              {isGeneratingMultiSig
                ? "Generating multi-signature document..."
                : "Loading..."}
            </div>
          ) : (
            <>
              {isSubmissionComplete && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                  <p className="font-medium">Success!</p>
                  <p>
                    Multi-signature document has been generated and saved
                    successfully.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select SOP with Multiple In-Progress Trainings:
                </label>
                <Select
                  value={selectedSopId}
                  onValueChange={handleSopSelect}
                  disabled={
                    Object.keys(inProgressSOPs).length === 0 ||
                    isSubmissionComplete
                  }
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
                    {completedSignatures.length === trainingsToSign.length
                      ? "All signatures collected. Click Submit to generate the multi-signature document."
                      : "You will be prompted to sign for each trainee sequentially. After collecting all signatures, click Submit to generate the document."}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    {isSubmissionComplete ? (
                      <Button type="button" onClick={onClose}>
                        Close
                      </Button>
                    ) : completedSignatures.length ===
                      trainingsToSign.length ? (
                      <Button
                        type="button"
                        onClick={() =>
                          generateAndUploadMultiSignaturePDF(
                            session?.user?.name || "Unknown Trainer"
                          )
                        }
                      >
                        Submit
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={startSignatureProcess}
                        disabled={trainingsToSign.length === 0}
                      >
                        {completedSignatures.length > 0
                          ? "Continue Signing"
                          : "Start Signing Process"}
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
