# Stack Auth Bootstrap Implementation

This document explains the implementation of the Stack Auth bootstrap process, which ensures teams and permissions are properly set up and users are assigned to the correct teams as they register.

## Overview

The Stack Auth bootstrap system provides:

1. Automatic creation of required teams and permissions in Stack Auth
2. Handling of new user registrations with pending status
3. Admin approval workflow for new users
4. Assignment of users to appropriate teams based on their role and site
5. Synchronization between Stack Auth and the application database

## Key Components

### 1. Stack Bootstrap (`src/lib/stack-bootstrap.ts`)

Core functionality to ensure teams and permissions exist in Stack Auth:

- `bootstrapTeamsAndPermissions()`: Main function to initialize all required teams and permissions
- `ensureDefaultTeamsExist()`: Creates admin and supervisor teams if they don't exist
- `ensureTeamExists()`: Utility to create a specific team
- `ensureSiteTeamExists()`: Creates a team for a specific site
- `ensurePermissionsExist()`: Sets up all permissions with correct hierarchies
- `addUserToTeam()`: Adds a user to a specific team
- `setupPendingUserPermissions()`: Sets up initial permissions for newly registered users
- `setupUserPermissionsAndTeams()`: Assigns appropriate permissions and team memberships based on user role

### 2. Stack Auth Integration (`src/lib/stack-auth-integration.ts`)

Integration layer between Stack Auth and the application database:

- `initializeStackAuth()`: Initializes Stack Auth teams and permissions
- `handleNewUserRegistration()`: Processes new user registrations
- `handleUserApproval()`: Handles user approval and assigns appropriate roles and teams
- `getStackUserIdFromDbUser()`: Gets Stack Auth user ID from database user ID or email
- `getDbUserFromStackUser()`: Gets database user from Stack Auth user ID

### 3. Webhook Handler (`src/app/api/auth/webhook/route.ts`)

Webhook handler for Stack Auth events:

- Processes user registration events
- Initializes Stack Auth on server startup
- Provides an example of how to handle user approval

### 4. Admin User Approval Component (`src/components/admin-user-approval.tsx`)

UI component for admins to approve pending users:

- Lists pending users from Stack Auth
- Allows admins to assign roles, sites, departments, and positions
- Handles the approval process

### 5. API Endpoints

- `src/app/api/admin/approve-user/route.ts`: Handles user approval requests
- `src/app/api/admin/stack-users/route.ts`: Lists Stack Auth users for the admin component

## Default Teams

The system creates and maintains the following default teams:

- **Admin Team**: For administrators with full system access
- **Supervisor Team**: For supervisors with training management capabilities
- **Site Teams**: One team per site for site-specific access

## User Registration Flow

1. User registers through Stack Auth
2. Webhook receives the registration event
3. User is assigned pending status with basic permissions
4. Admin reviews the pending user in the admin dashboard
5. Admin assigns role, site, department, and position
6. User is approved and assigned to appropriate teams
7. User can now access the system based on their permissions

## How to Use

### Initialize Stack Auth

Call `initializeStackAuth()` during application startup to ensure all required teams and permissions exist:

```typescript
import { initializeStackAuth } from "@/lib/stack-auth-integration";

// In your app initialization
initializeStackAuth().catch(console.error);
```

### Handle New User Registration

When a user registers, call `handleNewUserRegistration()` to set up their initial permissions:

```typescript
import { handleNewUserRegistration } from "@/lib/stack-auth-integration";

// In your webhook handler
await handleNewUserRegistration(userId);
```

### Approve a User

When an admin approves a user, call `handleUserApproval()` to set up their permissions and teams:

```typescript
import { handleUserApproval } from "@/lib/stack-auth-integration";

// In your approval handler
await handleUserApproval(userId, role, siteId, departmentId, positionId);
```

## Best Practices

1. **Always initialize Stack Auth on startup**: This ensures all required teams and permissions exist.
2. **Use the webhook handler**: Configure Stack Auth to send events to your webhook endpoint.
3. **Secure admin endpoints**: Ensure only authorized users can access admin endpoints.
4. **Keep permissions in sync**: If you add new permissions, update the `PERMISSIONS` and `PERMISSION_HIERARCHY` constants.
5. **Handle errors gracefully**: The bootstrap process includes error handling, but you should add additional error handling in your application.

## Conclusion

This implementation provides a robust solution for managing user permissions and team assignments in a multi-site, role-based application using Stack Auth. It ensures that users are properly assigned to teams and given appropriate permissions based on their role and site.
