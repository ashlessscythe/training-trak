import { z } from "zod";
import { Role, Shift } from "@prisma/client";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  role: z.nativeEnum(Role, { message: "Invalid role" }),
  siteId: z.string().cuid("Invalid site ID"),
  departmentId: z.string().cuid("Invalid department ID"),
  positionId: z.string().cuid("Invalid position ID"),
  shift: z.nativeEnum(Shift).optional(),
  ssoId: z.string().max(255).optional(),
});

export const updateUserSchema = z.object({
  id: z.string().cuid("Invalid user ID"),
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .optional(),
  role: z.nativeEnum(Role, { message: "Invalid role" }).optional(),
  siteId: z.string().cuid("Invalid site ID").optional(),
  departmentId: z.string().cuid("Invalid department ID").optional(),
  positionId: z.string().cuid("Invalid position ID").optional(),
  shift: z.nativeEnum(Shift).optional(),
  ssoId: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  siteId: z.string().cuid("Invalid site ID"),
  departmentId: z.string().cuid("Invalid department ID"),
  positionId: z.string().cuid("Invalid position ID"),
  shift: z.nativeEnum(Shift).optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export const userIdSchema = z.object({
  id: z.string().cuid("Invalid user ID"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
