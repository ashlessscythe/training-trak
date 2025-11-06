import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/constants";
import { z } from "zod";

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = HTTP_STATUS.OK) {
  return NextResponse.json({ data }, { status });
}

/**
 * Created response helper
 */
export function createdResponse<T>(data: T) {
  return NextResponse.json({ data }, { status: HTTP_STATUS.CREATED });
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: any
) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Validation error response helper
 */
export function validationErrorResponse(error: z.ZodError<any>) {
  const errors = error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return NextResponse.json(
    {
      error: "Validation failed",
      details: errors,
    },
    { status: HTTP_STATUS.BAD_REQUEST }
  );
}

/**
 * Unauthorized response helper
 */
export function unauthorizedResponse(message: string = "Unauthorized") {
  return errorResponse(message, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Forbidden response helper
 */
export function forbiddenResponse(message: string = "Forbidden") {
  return errorResponse(message, HTTP_STATUS.FORBIDDEN);
}

/**
 * Not found response helper
 */
export function notFoundResponse(message: string = "Not found") {
  return errorResponse(message, HTTP_STATUS.NOT_FOUND);
}

/**
 * Conflict response helper
 */
export function conflictResponse(message: string = "Conflict") {
  return errorResponse(message, HTTP_STATUS.CONFLICT);
}

/**
 * Bad request response helper
 */
export function badRequestResponse(message: string = "Bad request") {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST);
}

/**
 * Internal server error response helper
 */
export function internalServerErrorResponse(
  message: string = "Internal server error"
) {
  return errorResponse(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return NextResponse.json({
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
