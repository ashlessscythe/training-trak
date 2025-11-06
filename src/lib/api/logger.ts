import { NextRequest, NextResponse } from "next/server";

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  userId?: string;
  error?: string;
}

/**
 * Log API request
 */
export function logRequest(req: NextRequest, userId?: string): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userId,
  };

  console.log(`[API] ${entry.method} ${entry.url}`, {
    userId: entry.userId,
  });

  return entry;
}

/**
 * Log API response
 */
export function logResponse(
  entry: LogEntry,
  response: NextResponse,
  startTime: number
) {
  const duration = Date.now() - startTime;
  const status = response.status;

  console.log(`[API] ${entry.method} ${entry.url} - ${status} (${duration}ms)`, {
    userId: entry.userId,
    status,
    duration,
  });
}

/**
 * Log API error
 */
export function logError(
  entry: LogEntry,
  error: unknown,
  startTime: number
) {
  const duration = Date.now() - startTime;
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`[API] ${entry.method} ${entry.url} - ERROR (${duration}ms)`, {
    userId: entry.userId,
    error: errorMessage,
    duration,
  });
}

/**
 * Middleware wrapper that adds logging
 */
export function withLogging(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    const startTime = Date.now();
    const logEntry = logRequest(req);

    try {
      const response = await handler(req, context);
      logResponse(logEntry, response, startTime);
      return response;
    } catch (error) {
      logError(logEntry, error, startTime);
      throw error;
    }
  };
}

/**
 * Combined middleware wrapper with error handling and logging
 */
export function withMiddleware(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    const startTime = Date.now();
    const logEntry = logRequest(req);

    try {
      const response = await handler(req, context);
      logResponse(logEntry, response, startTime);
      return response;
    } catch (error) {
      logError(logEntry, error, startTime);
      
      // Re-throw to be handled by error handler
      throw error;
    }
  };
}
