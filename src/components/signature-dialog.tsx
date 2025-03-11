"use client";

import { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrainingProgress } from "@prisma/client";
import { jsPDF } from "jspdf";
// Note: We'll use a different approach for tables

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    signatureData: string;
    trainingId: string;
  }) => Promise<void>;
  training?: TrainingProgress & {
    user: { name: string; ssoId?: string };
    sop: { name: string; version: string };
  };
  title: string;
}

export function SignatureDialog({
  isOpen,
  onClose,
  onSubmit,
  training,
  title,
}: SignatureDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize canvas when dialog opens
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "black";
      }
    }
  }, [isOpen]);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasSigned(true);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const generatePDF = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        if (!training) {
          reject(new Error("Training data is missing"));
          return;
        }

        const doc = new jsPDF();
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error("Canvas reference is missing"));
          return;
        }

        // Add Penske logo and header
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(
          "ISO Training System - Penske Training Record Sheet",
          105,
          15,
          { align: "center" }
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

        // Signature will be added here

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

        // Add signature image to the PDF
        const signatureDataUrl = canvas.toDataURL("image/png");
        console.log(
          "Signature data URL:",
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
      } catch (error) {
        console.error("Error generating PDF:", error);
        reject(error);
      }
    });
  };

  const handleSubmit = async () => {
    if (!training || !hasSigned) return;

    setIsSubmitting(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const signatureData = canvas.toDataURL("image/png");

      await onSubmit({
        signatureData,
        trainingId: training.id,
      });
    } catch (error) {
      console.error("Error submitting signature:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {training && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">SOP:</p>
                <p>
                  {training.sop.name} (v{training.sop.version})
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Trainee:</p>
                <p>{training.user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">SSO ID:</p>
                <p>{training.user.ssoId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Date:</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Signature:</p>
              <div className="border border-gray-300 rounded-md p-1 bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  className="w-full touch-none cursor-crosshair border border-gray-200"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                >
                  Clear Signature
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              By signing this document, you acknowledge understanding and
              agreeing with the steps documented in the Procedure, Work
              Instructions or Training Module listed above.
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!hasSigned || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Signature"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
