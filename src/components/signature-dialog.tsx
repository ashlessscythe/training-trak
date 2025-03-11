"use client";

import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrainingProgress } from "@prisma/client";

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    signatureData: string;
    trainingId: string;
    trainerName: string;
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
  const { data: session } = useSession();

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

  const handleSubmit = async () => {
    if (!training || !hasSigned) return;

    setIsSubmitting(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const signatureData = canvas.toDataURL("image/png");
      const trainerName = session?.user?.name || "Unknown Trainer";

      await onSubmit({
        signatureData,
        trainingId: training.id,
        trainerName,
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
