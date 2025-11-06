import { z } from "zod";

export const createSiteSchema = z.object({
  code: z
    .string()
    .min(1, "Site code is required")
    .max(50, "Site code is too long")
    .regex(/^[A-Z0-9_-]+$/, "Site code must contain only uppercase letters, numbers, hyphens, and underscores"),
  name: z.string().min(1, "Site name is required").max(255, "Site name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
});

export const updateSiteSchema = z.object({
  id: z.string().cuid("Invalid site ID"),
  code: z
    .string()
    .min(1, "Site code is required")
    .max(50, "Site code is too long")
    .regex(/^[A-Z0-9_-]+$/, "Site code must contain only uppercase letters, numbers, hyphens, and underscores")
    .optional(),
  name: z.string().min(1, "Site name is required").max(255, "Site name is too long").optional(),
  description: z.string().max(1000, "Description is too long").optional(),
  isActive: z.boolean().optional(),
});

export const siteIdSchema = z.object({
  id: z.string().cuid("Invalid site ID"),
});

export const addSiteAdminSchema = z.object({
  siteId: z.string().cuid("Invalid site ID"),
  userId: z.string().cuid("Invalid user ID"),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type AddSiteAdminInput = z.infer<typeof addSiteAdminSchema>;
