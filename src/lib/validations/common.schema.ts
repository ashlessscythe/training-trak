import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().cuid("Invalid ID"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(255),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const filterSchema = z.object({
  isActive: z.coerce.boolean().optional(),
  siteId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  positionId: z.string().cuid().optional(),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
export type SortParams = z.infer<typeof sortSchema>;
export type FilterParams = z.infer<typeof filterSchema>;
