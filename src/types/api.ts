import { Role, TrainingStatus, Shift } from "@prisma/client";

// Common API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// User types
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
  siteId: string;
  departmentId: string;
  positionId: string;
  shift?: Shift;
  ssoId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  site?: SiteResponse;
  department?: DepartmentResponse;
  position?: PositionResponse;
  trainings?: TrainingProgressResponse[];
  uploadedDocs?: { id: string }[];
  createdSOPs?: { id: string }[];
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: Role;
  siteId: string;
  departmentId: string;
  positionId: string;
  shift?: Shift;
  ssoId?: string;
}

export interface UpdateUserRequest {
  id: string;
  email?: string;
  name?: string;
  password?: string;
  role?: Role;
  siteId?: string;
  departmentId?: string;
  positionId?: string;
  shift?: Shift;
  ssoId?: string;
  isActive?: boolean;
}

// Site types
export interface SiteResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: SiteStats;
}

export interface SiteStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  totalSOPs: number;
  completedTrainings: number;
}

export interface CreateSiteRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateSiteRequest {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Department types
export interface DepartmentResponse {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  siteId: string;
  createdAt: string;
  updatedAt: string;
  site?: SiteResponse;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  siteId: string;
}

export interface UpdateDepartmentRequest {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Position types
export interface PositionResponse {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  siteId: string;
  createdAt: string;
  updatedAt: string;
  site?: SiteResponse;
}

export interface CreatePositionRequest {
  name: string;
  description?: string;
  siteId: string;
}

export interface UpdatePositionRequest {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Training types
export interface TrainingProgressResponse {
  id: string;
  userId: string;
  trainingId: string;
  status: TrainingStatus;
  startedAt?: string;
  completedAt?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: UserResponse;
  training?: TrainingResponse;
}

export interface TrainingResponse {
  id: string;
  title: string;
  description?: string;
  isCritical: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Document types
export interface DocumentResponse {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
  siteId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: UserResponse;
  site?: SiteResponse;
}

// SOP types
export interface SOPResponse {
  id: string;
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  createdById: string;
  lastModifiedById?: string;
  siteId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserResponse;
  lastModifiedBy?: UserResponse;
  site?: SiteResponse;
  positions?: PositionResponse[];
}

// Auth types
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  name: string;
  password: string;
  siteId: string;
  departmentId: string;
  positionId: string;
  shift?: Shift;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Session types
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  siteId: string;
  adminSites?: { id: string }[];
}
