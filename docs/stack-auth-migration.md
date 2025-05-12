# Stack Auth Migration Plan: Sites to Teams

This document outlines the strategy for migrating our current site-based permission system to Stack Auth's team-based permission system.

## Current System

- Users belong to a single site (stored in `user.clientMetadata.siteId`)
- Users have a single role (OWNER, ADMIN, SITE_ADMIN, SUPERVISOR, USER)
- Permissions are derived from roles

## Target System

- Sites will be represented as Teams in Stack Auth
- Users can belong to multiple sites/teams
- Permissions will be granted at both the project level (global) and team level (site-specific)
- Role hierarchy will be maintained through permission nesting

## Migration Steps

### Phase 1: Parallel Systems (Current)

- Continue using the existing site and role system stored in `clientMetadata`
- Add Stack Auth permissions that mirror the existing roles
- When a role is assigned, grant the corresponding Stack Auth permissions
- Update permission checks to use Stack Auth's permission system
- This allows for a gradual transition without breaking existing functionality

### Phase 2: Team Creation

- Create a Stack Auth team for each site in the database
- Store the team ID in the site record
- Add all users with access to a site to the corresponding team
- Grant appropriate team permissions based on user roles

### Phase 3: Permission Migration

- Update all permission checks to use team-based permissions
- Modify the UI to support team-based access control
- Update user management to handle team membership

### Phase 4: Complete Migration

- Remove role-based permission checks
- Remove site ID from user metadata
- Fully rely on Stack Auth's team and permission system

## Implementation Details

### Team Structure

Each site will be represented as a team with the following structure:

```typescript
{
  id: string; // Unique identifier
  displayName: string; // Site name
  clientMetadata: {
    siteId: string; // Reference to our database site ID
    // Other site-specific metadata
  }
}
```

### Permission Mapping

| Current Role | Project Permission | Team Permission |
| ------------ | ------------------ | --------------- |
| OWNER        | owner              | $owner          |
| ADMIN        | admin              | $admin          |
| SITE_ADMIN   | site_admin         | $site_admin     |
| SUPERVISOR   | supervisor         | $supervisor     |
| USER         | user               | $member         |

### Feature-specific Permissions

| Feature              | Permission Name   | Team Permission |
| -------------------- | ----------------- | --------------- |
| Assign Training      | assign_training   | Yes             |
| Modify Training      | modify_training   | Yes             |
| Mark SOP as Critical | mark_sop_critical | Yes             |
| Edit SOP             | edit_sop          | Yes             |
| Access Site          | access_site       | Yes             |

## Code Examples

### Creating a Team for a Site

```typescript
async function createTeamForSite(site) {
  const team = await stackServerApp.createTeam({
    displayName: site.name,
    clientMetadata: {
      siteId: site.id,
    },
  });

  // Update site with team ID
  await prisma.site.update({
    where: { id: site.id },
    data: { teamId: team.id },
  });

  return team;
}
```

### Adding a User to a Site Team

```typescript
async function addUserToSiteTeam(userId, siteId, role) {
  // Get the site
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site.teamId) {
    throw new Error("Site does not have a team");
  }

  // Get the team
  const team = await stackServerApp.getTeam(site.teamId);

  // Add user to team
  await team.addUser(userId);

  // Grant role-based permissions
  const permission = mapRoleToTeamPermission(role);
  await user.grantPermission(team, permission);

  // Grant included permissions
  if (TEAM_PERMISSION_HIERARCHY[permission]) {
    for (const includedPermission of TEAM_PERMISSION_HIERARCHY[permission]) {
      await user.grantPermission(team, includedPermission);
    }
  }
}
```

### Checking Site-specific Permissions

```typescript
async function canUserAccessSite(user, siteId) {
  // Get the site
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site.teamId) {
    // Fall back to legacy check
    return user.clientMetadata?.siteId === siteId;
  }

  // Get the team
  const team = await user.getTeam(site.teamId);

  // Check if user has access permission
  return !!team && !!(await user.getPermission(team, "access_site"));
}
```

## Timeline

1. **Week 1-2**: Implement parallel permission system (Phase 1)
2. **Week 3-4**: Create teams for sites and add users (Phase 2)
3. **Week 5-6**: Update permission checks to use team-based permissions (Phase 3)
4. **Week 7-8**: Complete migration and remove legacy code (Phase 4)

## Rollback Plan

If issues arise during migration:

1. Keep the legacy permission system in place as a fallback
2. Add feature flags to toggle between old and new permission systems
3. Maintain database compatibility with both systems during the transition
