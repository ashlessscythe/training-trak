import { jsPDF } from "jspdf";
import { TrainingProgress } from "@prisma/client";
import { companyConfig } from "./config";

const COMPANY_NAME = companyConfig.name;

// Helper function to get the first word of the company name for logo
const getCompanyLogoText = (companyName: string): string => {
  const firstWord = companyName.split(' ')[0];
  return firstWord.toUpperCase();
};

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

const generateTrainingRecordPDF = async (
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

      // Add company logo using first word of company name
      const logoText = getCompanyLogoText(COMPANY_NAME);
      doc.setFillColor(0, 0, 0);
      doc.rect(10, 8, 40, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const logoX = 10 + 40 / 2;
      const logoY = 8 + 15 / 2 + 4;
      doc.text(logoText, logoX, logoY, { align: "center", baseline: "middle" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
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
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const table1Headers = [
        "DATE",
        "TRAINER",
        "COURSE NAME / SOP / TRAINING",
        "REV LEVEL",
        "APP. DATE",
      ];
      const table1ColWidths = [30, 30, 70, 30, 30];
      let xPos = 10;

      table1Headers.forEach((header, i) => {
        doc.rect(xPos, yPos, table1ColWidths[i], 7);
        doc.text(header, xPos + table1ColWidths[i] / 2, yPos + 5, {
          align: "center",
        });
        xPos += table1ColWidths[i];
      });

      // Table data
      yPos += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      xPos = 10;

      const dateStr = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });

      const table1Data = [
        dateStr,
        trainerName,
        `${sop.version} / ${sop.name}`,
        sop.version,
        new Date(trainings[0].createdAt).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
      ];

      table1Data.forEach((data, i) => {
        const cellHeight = 10;
        doc.rect(xPos, yPos, table1ColWidths[i], cellHeight);
        if (i === 2) {
          // Course name with wrapping
          renderWrappedText(
            doc,
            data,
            xPos + table1ColWidths[i] / 2,
            yPos,
            cellHeight,
            table1ColWidths[i] - 2
          );
        } else {
          doc.text(data, xPos + table1ColWidths[i] / 2, yPos + 6, {
            align: "center",
          });
        }
        xPos += table1ColWidths[i];
      });

      // Second table - Employee info
      yPos += 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      const table2Headers = [
        "S.S.O NUMBER",
        "EMPLOYEE NAME",
        "EMPLOYEE SIGNATURE",
        "VALIDATION DUE",
        "ACTUAL VAL. DATE",
      ];
      const table2ColWidths = [30, 40, 40, 40, 40];
      xPos = 10;

      table2Headers.forEach((header, i) => {
        doc.rect(xPos, yPos, table2ColWidths[i], 7);
        doc.text(header, xPos + table2ColWidths[i] / 2, yPos + 5, {
          align: "center",
        });
        xPos += table2ColWidths[i];
      });

      // Process signatures
      const signaturePromises = Array.from(signatures.entries()).map(
        ([trainingId, blob]) => {
          return new Promise<{ trainingId: string; dataUrl: string }>(
            (resolveSignature, rejectSignature) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolveSignature({
                    trainingId,
                    dataUrl: reader.result as string,
                  });
                };
                reader.onerror = rejectSignature;
                reader.readAsDataURL(blob);
              } else {
                resolveSignature({ trainingId, dataUrl: "" });
              }
            }
          );
        }
      );

      Promise.all(signaturePromises)
        .then((signatureDataUrls) => {
          const signatureMap = new Map<string, string>();
          signatureDataUrls.forEach(({ trainingId, dataUrl }) => {
            signatureMap.set(trainingId, dataUrl);
          });

          // Table data - one row per trainee
          yPos += 7;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);

          trainings.forEach((training) => {
            xPos = 10;
            const rowData = [
              training.user.ssoId || "N/A",
              training.user.name,
              "", // Signature placeholder
              new Date(
                new Date().setDate(new Date().getDate() + 21)
              ).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              }),
              "", // Actual val date
            ];

            rowData.forEach((data, i) => {
              doc.rect(xPos, yPos, table2ColWidths[i], 10);
              if (i === 2) {
                const signatureDataUrl = signatureMap.get(training.id);
                if (signatureDataUrl) {
                  doc.addImage(
                    signatureDataUrl,
                    "PNG",
                    xPos + 5,
                    yPos + 1,
                    30,
                    8
                  );
                }
              } else {
                doc.text(data, xPos + table2ColWidths[i] / 2, yPos + 6, {
                  align: "center",
                });
              }
              xPos += table2ColWidths[i];
            });
            yPos += 10;
          });

          // Add document ID and disclaimer
          yPos += 10;
          const docId = `${sop.name.replace(
            /\s+/g,
            "-"
          )}-${sop.version}-${new Date().toISOString().split("T")[0]}`;
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(docId, 105, yPos, { align: "center" });

          yPos += 7;
          doc.setFont("helvetica", "normal");
          const disclaimer =
            "By signing this document, you acknowledge understanding and agreeing with the steps documented in the Procedure, Work Instructions or Training Module listed above.";
          const splitText = doc.splitTextToSize(disclaimer, 180);
          doc.text(splitText, 105, yPos, { align: "center" });

          // Add checkboxes section
          yPos += 15;

          // QR Code section
          doc.setFont("helvetica", "bold");
          doc.rect(10, yPos, 40, 30);
          doc.text("QR Code", 30, yPos + 5, { align: "center" });
          // Placeholder for QR code image
          doc.rect(15, yPos + 8, 30, 20, "D");

          // Other options
          xPos = 50;
          const options = [
            "DEMONSTRATION OF TASK",
            "EXAMINATION",
            "OTHER",
          ];
          const optionWidth = (150 - 10) / options.length;

          options.forEach((option) => {
            doc.rect(xPos, yPos, optionWidth, 10);
            doc.rect(xPos + 2, yPos + 2, 3, 3); // Checkbox
            doc.text(option, xPos + 10, yPos + 5, {
              align: "left",
            });
            xPos += optionWidth;
          });

          yPos += 10;
          xPos = 50;
          const bottomTexts = [
            "(Witness must initial on completion)",
            "(Attach examination)",
            "(Explain):",
          ];
          bottomTexts.forEach((text) => {
            doc.rect(xPos, yPos, optionWidth, 20);
            doc.text(text, xPos + optionWidth / 2, yPos + 5, {
              align: "center",
            });
            xPos += optionWidth;
          });

          // Generate PDF blob
          const pdfBlob = doc.output("blob");
          resolve(pdfBlob);
        })
        .catch(reject);
    } catch (error) {
      console.error("Error generating training record PDF:", error);
      reject(error);
    }
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
  return generateTrainingRecordPDF(trainings, signatures, trainerName);
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
  const signatures = new Map<string, Blob>();
  signatures.set(training.id, signatureBlob);
  return generateTrainingRecordPDF([training], signatures, trainerName);
};
