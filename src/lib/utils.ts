import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TrainingStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the color class for a training status
 * This function will automatically work with any status in the TrainingStatus enum
 * and handles the isSigned boolean separately
 */
export function getTrainingStatusColor(
  status: TrainingStatus,
  isSigned?: boolean
): string {
  if (isSigned) {
    return "text-green-600";
  }

  switch (status) {
    case "COMPLETED":
      return "text-blue-600";
    case "IN_PROGRESS":
      return "text-yellow-600";
    default:
      // This will handle any new statuses added to the enum in the future
      return "text-gray-600";
  }
}

/**
 * Get the display text for a training status
 * This function will automatically work with any status in the TrainingStatus enum
 * and handles the isSigned boolean separately
 */
export function getTrainingStatusText(
  status: TrainingStatus,
  isSigned?: boolean
): string {
  if (isSigned) {
    return "Signed";
  }

  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "IN_PROGRESS":
      return "In Progress";
    default:
      // For any new statuses, format them nicely by replacing underscores with spaces
      return String(status).replace(/_/g, " ");
  }
}

/**
 * Get the background color class for a training status
 * This can be used for badges or other UI elements
 */
export function getTrainingStatusBgColor(
  status: TrainingStatus,
  isSigned?: boolean
): string {
  if (isSigned) {
    return "bg-green-100";
  }

  switch (status) {
    case "COMPLETED":
      return "bg-blue-100";
    case "IN_PROGRESS":
      return "bg-yellow-100";
    default:
      return "bg-gray-100";
  }
}
