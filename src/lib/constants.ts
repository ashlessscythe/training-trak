export const ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  SITE_ADMIN: "SITE_ADMIN",
  SUPERVISOR: "SUPERVISOR",
  USER: "USER",
  PENDING: "PENDING",
} as const;

export const ADMIN_ROLES = [ROLES.OWNER, ROLES.ADMIN] as const;
export const SITE_MANAGEMENT_ROLES = [
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.SITE_ADMIN,
] as const;
export const ELEVATED_ROLES = [
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.SITE_ADMIN,
  ROLES.SUPERVISOR,
] as const;

export const TRAINING_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  SIGNED: "SIGNED",
} as const;

export const SHIFTS = {
  FIRST: "FIRST",
  SECOND: "SECOND",
  THIRD: "THIRD",
  WEEKEND: "WEEKEND",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not found",
  INTERNAL_SERVER_ERROR: "Internal server error",
  MISSING_CREDENTIALS: "Missing credentials",
  INVALID_CREDENTIALS: "Invalid credentials",
  MISSING_REQUIRED_FIELDS: "Missing required fields",
  EMAIL_ALREADY_EXISTS: "Email already exists",
  CODE_ALREADY_EXISTS: "Code already exists",
  USER_NOT_FOUND: "User not found",
  SITE_NOT_FOUND: "Site not found",
  INVALID_ID: "Invalid ID",
} as const;

export const API_ROUTES = {
  AUTH: {
    SIGNIN: "/api/auth/signin",
    SIGNUP: "/api/auth/signup",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
  },
  USERS: {
    BASE: "/api/users",
    ME: "/api/users/me",
    APPROVE: "/api/users/approve",
  },
  SITES: {
    BASE: "/api/sites",
    BY_ID: (id: string) => `/api/sites/${id}`,
    USERS: (id: string) => `/api/sites/${id}/users`,
    DEPARTMENTS: (id: string) => `/api/sites/${id}/departments`,
    POSITIONS: (id: string) => `/api/sites/${id}/positions`,
    TRAININGS: (id: string) => `/api/sites/${id}/trainings`,
    DOCUMENTS: (id: string) => `/api/sites/${id}/documents`,
    SOPS: (id: string) => `/api/sites/${id}/sops`,
    ADMINS: (id: string) => `/api/sites/${id}/admins`,
  },
  DEPARTMENTS: {
    BASE: "/api/departments",
  },
  POSITIONS: {
    BASE: "/api/positions",
  },
  TRAININGS: {
    BASE: "/api/trainings",
  },
  DOCUMENTS: {
    BASE: "/api/documents",
    DOWNLOAD: (id: string) => `/api/documents/${id}/download`,
  },
  SOPS: {
    BASE: "/api/sops",
  },
  EMAIL: {
    BASE: "/api/email",
    TEST: "/api/email/test",
  },
} as const;

export const PAGE_ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  AUTH: {
    SIGNIN: "/auth/signin",
    SIGNUP: "/auth/signup",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    PENDING: "/auth/pending",
  },
  ADMIN: {
    BASE: "/admin",
    USERS: "/admin/users",
    SITES: "/admin/sites",
    SITE_DETAILS: (id: string) => `/admin/sites/${id}`,
    DEPARTMENTS: "/admin/departments",
    POSITIONS: "/admin/positions",
    TRAINING: "/admin/training",
    DOCUMENTS: "/admin/documents",
    SOPS: "/admin/sops",
    EMAIL_TEST: "/admin/email-test",
  },
  SITES: {
    USERS: (id: string) => `/sites/${id}/users`,
    DEPARTMENTS: (id: string) => `/sites/${id}/departments`,
    POSITIONS: (id: string) => `/sites/${id}/positions`,
    TRAINING: (id: string) => `/sites/${id}/training`,
    HISTORICAL_TRAININGS: (id: string) => `/sites/${id}/historical-trainings`,
    DOCUMENTS: (id: string) => `/sites/${id}/documents`,
    SOPS: (id: string) => `/sites/${id}/sops`,
  },
} as const;
