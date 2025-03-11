import { TrainingWithRelations } from "@/lib/pdf";

/**
 * Utility functions for document upload operations
 */

/**
 * Uploads a signature document to the server
 * @param pdfBlob The PDF blob to upload
 * @param training The training record with user and SOP relations
 * @param trainingId The ID of the training record
 * @returns A Promise that resolves when the upload is complete
 */
export const uploadSignatureDocument = async (
  pdfBlob: Blob,
  training: TrainingWithRelations,
  trainingId: string
): Promise<void> => {
  try {
    // Create a form data object to send the signature
    const formData = new FormData();

    // Create a File object from the PDF blob
    const pdfFile = new File(
      [pdfBlob],
      `training-signature-${training?.sop.name.replace(/\s+/g, "-")}-${
        new Date().toISOString().split("T")[0]
      }.pdf`,
      { type: "application/pdf" }
    );

    // Add the file to the form data
    formData.append("content", pdfFile);
    formData.append("type", "SIGNATURE_SHEET");
    formData.append(
      "metadata",
      JSON.stringify({
        description: `Training signature for ${training?.sop.name} (v${training?.sop.version})`,
        category: "Training",
        tags: ["signature", "training", training?.sop.name],
        version: "1.0",
        trainingId: trainingId,
      })
    );

    if (training?.sopId) {
      formData.append("sopId", training.sopId);
    }

    // Send the form data to the documents API
    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to save signature document");
    }
  } catch (error) {
    console.error("Error uploading signature document:", error);
    throw error;
  }
};
