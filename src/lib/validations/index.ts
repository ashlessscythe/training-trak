export * from "./user.schema";
export * from "./site.schema";
export * from "./common.schema";

import { z } from "zod";
import { NextRequest } from "next/server";

/**
 * Validate request body against a schema
 */
export async function validateBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  const body = await req.json();
  return schema.parse(body);
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): z.infer<T> {
  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());
  return schema.parse(params);
}

/**
 * Validate route parameters against a schema
 */
export function validateParams<T extends z.ZodType>(
  params: any,
  schema: T
): z.infer<T> {
  return schema.parse(params);
}

/**
 * Safe validation that returns result with error
 */
export async function safeValidateBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: z.ZodError }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    return result;
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          path: [],
          message: "Invalid JSON body",
        },
      ]),
    };
  }
}
