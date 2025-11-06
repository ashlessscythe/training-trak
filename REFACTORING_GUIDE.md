# Refactoring Guide

This guide explains how to migrate existing route handlers to use the new patterns.

## Overview of Changes

The refactoring introduces:

1. **Shared Constants** - Centralized constants for roles, status codes, error messages
2. **Type Definitions** - Comprehensive TypeScript types for API requests/responses
3. **Authentication Middleware** - Reusable auth functions
4. **RBAC System** - Permission-based access control
5. **Repository Pattern** - Data access layer with Prisma
6. **Validation Schemas** - Zod schemas for request validation
7. **Service Layer** - Business logic separation
8. **Response Helpers** - Standardized API responses
9. **Logging Middleware** - Request/response logging
10. **Feature-based Components** - Organized component structure
11. **Data Fetching Hooks** - Reusable React hooks

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
```

**After:**
```typescript
import { NextRequest } from "next/server";
import { requireRoles, withErrorHandler } from "@/lib/api/auth";
import { successResponse, createdResponse } from "@/lib/api/response";
import { UserService } from "@/lib/services";
import { validateBody, createUserSchema } from "@/lib/validations";
import { ADMIN_ROLES } from "@/lib/constants";
import { withLogging } from "@/lib/api/logger";
```

### Step 2: Replace Authentication Logic

**Before:**
```typescript
const session = await getServerSession();
if (!session?.user?.email) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const currentUser = await prisma.user.findUnique({
  where: { email: session.user.email },
  select: { role: true },
});

if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**After:**
```typescript
await requireRoles(ADMIN_ROLES);
```

### Step 3: Replace Manual Validation

**Before:**
```typescript
const data = await req.json();
const { email, name, password, role, siteId, departmentId, positionId } = data;

if (!email || !name || !password || !role || !siteId || !departmentId || !positionId) {
  return NextResponse.json(
    { error: "Missing required fields" },
    { status: 400 }
  );
}
```

**After:**
```typescript
const data = await validateBody(req, createUserSchema);
```

### Step 4: Replace Direct Prisma Calls with Services

**Before:**
```typescript
const hashedPassword = await hash(password, 10);

const user = await prisma.user.create({
  data: {
    email,
    name,
    password: hashedPassword,
    role,
    siteId,
    departmentId,
    positionId,
    isActive: true,
  },
});

return NextResponse.json(user);
```

**After:**
```typescript
const user = await UserService.createUser(data);
return createdResponse(user);
```

### Step 5: Replace Error Handling

**Before:**
```typescript
try {
  // ... handler logic
} catch (error: any) {
  if (error.code === "P2002") {
    return NextResponse.json(
      { error: "Email already exists" },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

**After:**
```typescript
// Wrap handler with withErrorHandler - it handles all errors automatically
export const POST = withErrorHandler(async (req: NextRequest) => {
  // ... handler logic
  // Errors are automatically caught and formatted
});
```

### Step 6: Add Logging

**Before:**
```typescript
export async function GET(req: NextRequest) {
  // ... handler logic
}
```

**After:**
```typescript
export const GET = withLogging(
  withErrorHandler(async (req: NextRequest) => {
    // ... handler logic
  })
);
```

## Complete Example

### Before (Old Pattern)

```typescript
import { getServerSession } from "next-auth/next";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { email, name, password, role, siteId, departmentId, positionId } = data;

    if (!email || !name || !password || !role || !siteId || !departmentId || !positionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        siteId,
        departmentId,
        positionId,
        isActive: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### After (New Pattern)

```typescript
import { NextRequest } from "next/server";
import { requireRoles, withErrorHandler } from "@/lib/api/auth";
import { createdResponse } from "@/lib/api/response";
import { UserService } from "@/lib/services";
import { validateBody, createUserSchema } from "@/lib/validations";
import { ADMIN_ROLES } from "@/lib/constants";
import { withLogging } from "@/lib/api/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/users
 * Create a new user (Admin only)
 */
export const POST = withLogging(
  withErrorHandler(async (req: NextRequest) => {
    await requireRoles(ADMIN_ROLES);

    const data = await validateBody(req, createUserSchema);
    const user = await UserService.createUser(data);

    return createdResponse(user);
  })
);
```

## Benefits

1. **Reduced Code** - ~70% less code per route handler
2. **Consistency** - All routes follow the same pattern
3. **Type Safety** - Full TypeScript support with Zod validation
4. **Maintainability** - Business logic in services, not routes
5. **Testability** - Services and repositories can be tested independently
6. **Logging** - Automatic request/response logging
7. **Error Handling** - Consistent error responses
8. **Security** - Centralized auth and permission checks

## Component Migration

### Before (Flat Structure)
```
src/components/
  user-dialog.tsx
  user-form.tsx
  users-list.tsx
  site-dialog.tsx
  site-form.tsx
  ...
```

### After (Feature-based)
```
src/components/
  features/
    users/
      index.ts
      user-dialog.tsx
      user-form.tsx
      users-list.tsx
    sites/
      index.ts
      site-dialog.tsx
      site-form.tsx
```

### Import Changes

**Before:**
```typescript
import { UserDialog } from "@/components/user-dialog";
import { UserForm } from "@/components/user-form";
```

**After:**
```typescript
import { UserDialog, UserForm } from "@/components/features/users";
```

## Data Fetching Migration

### Before (Manual Fetch)
```typescript
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/users")
    .then(res => res.json())
    .then(data => {
      setUsers(data);
      setLoading(false);
    });
}, []);
```

### After (Custom Hook)
```typescript
import { useUsers } from "@/hooks/use-users";

const { users, loading, error, createUser, updateUser } = useUsers();
```

## Next Steps

1. Review the example `.new.ts` files in `src/app/api/`
2. Test the new patterns with a few routes
3. Gradually migrate remaining routes
4. Update component imports to use feature-based structure
5. Replace manual fetch calls with custom hooks
6. Remove `.new.ts` files once migration is complete

## Files to Review

- `src/lib/constants.ts` - Shared constants
- `src/types/api.ts` - API types
- `src/lib/api/auth.ts` - Auth middleware
- `src/lib/permissions.ts` - RBAC system
- `src/lib/repositories/` - Data access layer
- `src/lib/validations/` - Validation schemas
- `src/lib/services/` - Business logic
- `src/lib/api/response.ts` - Response helpers
- `src/lib/api/logger.ts` - Logging middleware
- `src/hooks/` - Data fetching hooks
- `docs/API.md` - API documentation
