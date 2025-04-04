import { jsPDF } from "jspdf";
import { TrainingProgress } from "@prisma/client";
import { companyConfig } from "./config";

const COMPANY_NAME = companyConfig.name;

export interface TrainingWithRelations extends TrainingProgress {
  user: { name: string; ssoId?: string };
  sop: { name: string; version: string };
}

export interface SignatureData {
  trainingId: string;
  signatureBlob: Blob;
  training: TrainingWithRelations;
}

/**
 * Renders wrapped text centered within a cell
 * @param doc The jsPDF document instance
 * @param text The text to wrap and render
 * @param x The x-coordinate of the center of the text
 * @param yPos The y-coordinate of the top of the cell
 * @param cellHeight The height of the cell
 * @param maxWidth The maximum width for the text
 */
const renderWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  yPos: number,
  cellHeight: number,
  maxWidth: number
): void => {
  // Wrap text to fit within the specified width
  const lines = doc.splitTextToSize(text, maxWidth);

  // Calculate vertical position to center the text based on number of lines
  const lineHeight = 3; // Approximate line height
  const totalTextHeight = lines.length * lineHeight;
  const startY = yPos + cellHeight / 2 - totalTextHeight / 2 + lineHeight;

  // Draw each line of the wrapped text
  lines.forEach((line: string, index: number) => {
    doc.text(line, x, startY + index * lineHeight, { align: "center" });
  });
};

/**
 * Generates a PDF with multiple signature lines for multiple trainees
 * @param trainings Array of training records with user and SOP relations
 * @param signatures Map of training IDs to signature blobs
 * @param trainerName The name of the trainer (current user)
 * @returns A Promise that resolves to a Blob containing the PDF
 */
export const generateMultiSignaturePDF = async (
  trainings: TrainingWithRelations[],
  signatures: Map<string, Blob>,
  trainerName: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      if (!trainings || trainings.length === 0) {
        reject(new Error("Training data is missing"));
        return;
      }

      // All trainings should have the same SOP
      const sop = trainings[0].sop;

      // Create a new jsPDF instance
      const doc = new jsPDF();

      // Add company logo and header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(
        `ISO Training System - ${COMPANY_NAME} Training Record Sheet`,
        105,
        15,
        {
          align: "center",
        }
      );
      doc.setFontSize(12);
      doc.text("2.1", 105, 22, { align: "center" });

      // Add horizontal line
      doc.setLineWidth(0.5);
      doc.line(10, 25, 200, 25);

      // First table - Training info
      let yPos = 30;

      // Table headers
      doc.setFillColor(0, 0, 0);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.rect(10, yPos, 30, 10, "F");
      doc.text("DATE", 25, yPos + 6, { align: "center" });

      // set again
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);

      doc.rect(40, yPos, 30, 10);
      doc.text("TRAINER", 55, yPos + 6, { align: "center" });

      doc.rect(70, yPos, 60, 10);
      doc.text("COURSE NAME / SOP / TRAINING", 100, yPos + 6, {
        align: "center",
      });

      doc.rect(130, yPos, 30, 10);
      doc.text("REV LEVEL", 145, yPos + 6, { align: "center" });

      doc.rect(160, yPos, 40, 10);
      doc.text("APP. DATE", 180, yPos + 6, { align: "center" });

      // Table data
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);

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

      // Add trainer name
      doc.text(trainerName, 55, yPos + 6, { align: "center" });

      // Render procedure name with text wrapping
      const procedureNameWidth = 55; // Slightly less than cell width (60) for margin
      renderWrappedText(doc, sop.name, 100, yPos, 10, procedureNameWidth);

      doc.text(sop.version, 145, yPos + 6, { align: "center" });

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

      // Second table - Employee info with multiple rows
      yPos += 20;

      // Table headers
      doc.setFillColor(0, 0, 0);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);

      doc.rect(10, yPos, 30, 10, "F");
      doc.text("S.S.O NUMBER", 25, yPos + 6, { align: "center" });

      // set again
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);

      doc.rect(40, yPos, 40, 10);
      doc.text("EMPLOYEE NAME", 60, yPos + 6, { align: "center" });

      doc.rect(80, yPos, 40, 10);
      doc.text("EMPLOYEE SIGNATURE", 100, yPos + 6, { align: "center" });

      doc.rect(120, yPos, 40, 10);
      doc.text("VALIDATION DUE", 140, yPos + 6, { align: "center" });

      doc.rect(160, yPos, 40, 10);
      doc.text("ACTUAL VAL. DATE", 180, yPos + 6, { align: "center" });

      // Process all signatures first to get data URLs
      const signaturePromises = Array.from(signatures.entries()).map(
        ([trainingId, blob]) => {
          return new Promise<{ trainingId: string; dataUrl: string }>(
            (resolveSignature, rejectSignature) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolveSignature({
                  trainingId,
                  dataUrl: reader.result as string,
                });
              };
              reader.onerror = (error) => {
                rejectSignature(error);
              };
              reader.readAsDataURL(blob);
            }
          );
        }
      );

      Promise.all(signaturePromises)
        .then((signatureDataUrls) => {
          // Create a map of training IDs to signature data URLs
          const signatureMap = new Map<string, string>();
          signatureDataUrls.forEach(({ trainingId, dataUrl }) => {
            signatureMap.set(trainingId, dataUrl);
          });

          // Table data - one row per trainee
          yPos += 10;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);

          // Add a row for each trainee
          trainings.forEach((training, index) => {
            const rowYPos = yPos + index * 10;

            // Draw cell borders
            doc.rect(10, rowYPos, 30, 10);
            doc.rect(40, rowYPos, 40, 10);
            doc.rect(80, rowYPos, 40, 10);
            doc.rect(120, rowYPos, 40, 10);
            doc.rect(160, rowYPos, 40, 10);

            // Add cell content - ensure SSO ID is displayed
            const ssoId = training.user.ssoId || "N/A";
            doc.text(ssoId, 25, rowYPos + 6, {
              align: "center",
            });

            doc.text(training.user.name, 60, rowYPos + 6, { align: "center" });

            // Add signature if available
            const signatureDataUrl = signatureMap.get(training.id);
            if (signatureDataUrl) {
              // Position signature in the signature cell
              const signatureX = 100; // Center of signature cell
              const signatureY = rowYPos + 5; // Middle of the row
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
            }

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
              rowYPos + 6,
              { align: "center" }
            );

            // Actual validation date is empty
          });

          // Update yPos to be after the last row
          yPos += trainings.length * 10;

          // Add document ID and disclaimer
          yPos += 10;
          const docId = `${sop.name.replace(/\s+/g, "-")}-${sop.version}-${
            new Date().toISOString().split("T")[0]
          }`;
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

          // Table headers - using dark gray background with white text
          doc.setFillColor(75, 75, 75);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);

          doc.rect(10, yPos, 40, 10, "F");
          doc.text("QR Code", 30, yPos + 6, { align: "center" });

          // set again
          doc.setFillColor(255, 255, 255);
          doc.setTextColor(0, 0, 0);

          doc.rect(50, yPos, 50, 10);
          doc.text("DEMONSTRATION OF TASK", 75, yPos + 6, { align: "center" });

          doc.rect(100, yPos, 50, 10);
          doc.text("EXAMINATION", 125, yPos + 6, { align: "center" });

          doc.rect(150, yPos, 50, 10);
          doc.text("OTHER", 175, yPos + 6, { align: "center" });

          // Table data - Reset text color to black for cell content
          yPos += 10;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);

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
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      console.error("Error generating multi-signature PDF:", error);
      reject(error);
    }
  });
};

/**
 * Generates a PDF with the signature for a training record
 * @param training The training record with user and SOP relations
 * @param signatureBlob The signature as a Blob
 * @param trainerName The name of the trainer (current user)
 * @returns A Promise that resolves to a Blob containing the PDF
 */
export const generateSignaturePDF = async (
  training: TrainingWithRelations,
  signatureBlob: Blob,
  trainerName: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      if (!training) {
        reject(new Error("Training data is missing"));
        return;
      }

      // Create a new jsPDF instance
      const doc = new jsPDF();

      // Add company logo and header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(
        `ISO Training System - ${COMPANY_NAME} Training Record Sheet`,
        105,
        15,
        {
          align: "center",
        }
      );
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

      // set again
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);

      doc.rect(40, yPos, 30, 10);
      doc.text("TRAINER", 55, yPos + 6, { align: "center" });

      doc.rect(70, yPos, 60, 10);
      doc.text("COURSE NAME / SOP / TRAINING", 100, yPos + 6, {
        align: "center",
      });

      doc.rect(130, yPos, 30, 10);
      doc.text("REV LEVEL", 145, yPos + 6, { align: "center" });

      doc.rect(160, yPos, 40, 10);
      doc.text("APP. DATE", 180, yPos + 6, { align: "center" });

      // Table data
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);

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

      // Add trainer name
      doc.text(trainerName, 55, yPos + 6, { align: "center" });

      // Render procedure name with text wrapping
      const procedureNameWidth = 55; // Slightly less than cell width (60) for margin
      renderWrappedText(
        doc,
        training.sop.name,
        100,
        yPos,
        10,
        procedureNameWidth
      );

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
      doc.setFontSize(10);

      doc.rect(10, yPos, 30, 10, "F");
      doc.text("S.S.O NUMBER", 25, yPos + 6, { align: "center" });

      // set again
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);

      doc.rect(40, yPos, 40, 10);
      doc.text("EMPLOYEE NAME", 60, yPos + 6, { align: "center" });

      doc.rect(80, yPos, 40, 10);
      doc.text("EMPLOYEE SIGNATURE", 100, yPos + 6, { align: "center" });

      doc.rect(120, yPos, 40, 10);
      doc.text("VALIDATION DUE", 140, yPos + 6, { align: "center" });

      doc.rect(160, yPos, 40, 10);
      doc.text("ACTUAL VAL. DATE", 180, yPos + 6, { align: "center" });

      // Table data
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);

      // Draw cell borders
      doc.rect(10, yPos, 30, 10);
      doc.rect(40, yPos, 40, 10);
      doc.rect(80, yPos, 40, 10);
      doc.rect(120, yPos, 40, 10);
      doc.rect(160, yPos, 40, 10);

      // Add cell content - ensure SSO ID is displayed
      const ssoId = training.user.ssoId || "N/A";
      doc.text(ssoId, 25, yPos + 6, { align: "center" });

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

        // Table headers - using dark gray background with white text
        doc.setFillColor(75, 75, 75);
        doc.setTextColor(255, 255, 255);

        doc.rect(10, yPos, 40, 10, "F");
        doc.text("QR Code", 30, yPos + 6, { align: "center" });

        // set again
        doc.setFillColor(255, 255, 255);
        doc.setTextColor(0, 0, 0);

        doc.rect(50, yPos, 50, 10);
        doc.text("DEMONSTRATION OF TASK", 75, yPos + 6, { align: "center" });

        doc.rect(100, yPos, 50, 10);
        doc.text("EXAMINATION", 125, yPos + 6, { align: "center" });

        doc.rect(150, yPos, 50, 10);
        doc.text("OTHER", 175, yPos + 6, { align: "center" });

        // Table data - Reset text color to black for cell content
        yPos += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);

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
