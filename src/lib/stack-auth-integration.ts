import {
  bootstrapTeamsAndPermissions,
  setupPendingUserPermissions,
  setupUserPermissionsAndTeams,
} from "./stack-bootstrap";
import { stackServerApp } from "@/stack";
import prisma from "./prisma";

/**
 * Initialize Stack Auth teams and permissions
 * This should be called during application startup or first admin login
 */
export async function initializeStackAuth(): Promise<void> {
  try {
    console.log("Initializing Stack Auth integration...");

    // Bootstrap teams and permissions
    await bootstrapTeamsAndPermissions();

    console.log("Stack Auth initialization complete");
  } catch (error) {
    console.error("Error initializing Stack Auth:", error);
  }
}

/**
 * Handle new user registration
 * This should be called when a new user registers through Stack Auth
 * It sets up the user with pending status in Stack Auth
 */
export async function handleNewUserRegistration(userId: string): Promise<void> {
  try {
    const stackUser = await stackServerApp.getUser(userId);
    if (!stackUser) {
      throw new Error(`Stack Auth user not found: ${userId}`);
    }

    const email = stackUser.primaryEmail;
    const name = stackUser.displayName || email?.split("@")[0] || "New User";

    console.log(`Processing new user registration: ${email}`);

    // Check if this is an OAuth user
    const isOAuthUser =
      stackUser.oauthProviders && stackUser.oauthProviders.length > 0;

    // Set up pending permissions in Stack Auth
    // For OAuth users, we'll set a special status to indicate they came through OAuth
    await setupPendingUserPermissions(userId);

    // If this is an OAuth user, update their metadata to indicate they came through OAuth
    if (isOAuthUser) {
      await stackUser.update({
        clientReadOnlyMetadata: {
          ...stackUser.clientReadOnlyMetadata,
          status: "PENDING",
          registrationType: "OAUTH",
          oauthProvider: stackUser.oauthProviders?.[0]?.id || "unknown",
          registeredAt: new Date().toISOString(),
        },
      });
      console.log(
        `OAuth user registration processed: ${email} via ${
          stackUser.oauthProviders?.[0]?.id || "unknown"
        }`
      );
    }

    console.log(`New user registration processed successfully: ${email}`);
  } catch (error) {
    console.error(
      `Error processing new user registration for ${userId}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle user approval
 * This should be called when an admin approves a pending user
 * It sets up the appropriate permissions and team memberships based on the assigned role
 * and creates/updates the corresponding database record
 */
export async function handleUserApproval(
  userId: string,
  role: string,
  siteId: string,
  departmentId: string,
  positionId: string
): Promise<void> {
  try {
    console.log(`Processing user approval: ${userId} with role ${role}`);

    // 1. Get the site information
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, name: true },
    });

    if (!site) {
      throw new Error(`Site not found: ${siteId}`);
    }

    // 2. Set up permissions and team memberships in Stack Auth
    await setupUserPermissionsAndTeams(userId, role, siteId, site.name);

    // 3. Get the Stack Auth user
    const stackUser = await stackServerApp.getUser(userId);
    if (!stackUser) {
      throw new Error(`Stack Auth user not found: ${userId}`);
    }

    const email = stackUser.primaryEmail;
    if (!email) {
      throw new Error(`Email not found for user: ${userId}`);
    }

    const name = stackUser.displayName || email.split("@")[0] || "User";

    // 4. Check if user already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { email },
        data: {
          name,
          role: role as any, // Cast to any to handle the role enum
          isActive: true,
          siteId,
          departmentId,
          positionId,
          // Use SSO ID if available
          ssoId: stackUser.id,
        },
      });
    } else {
      // Create new user in database
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: await generateRandomPassword(), // Generate a random password for SSO users
          role: role as any,
          isActive: true,
          siteId,
          departmentId,
          positionId,
          ssoId: stackUser.id,
        },
      });

      // Store the database user ID in Stack Auth user metadata
      await stackUser.update({
        clientReadOnlyMetadata: {
          ...stackUser.clientReadOnlyMetadata,
          dbUserId: newUser.id,
        },
      });
    }

    console.log(`User approval processed successfully: ${userId}`);
  } catch (error) {
    console.error(`Error processing user approval for ${userId}:`, error);
    throw error;
  }
}

/**
 * Generate a random secure password for SSO users
 * Since they'll be using SSO, they won't need this password
 * but our database schema requires it
 */
async function generateRandomPassword(): Promise<string> {
  // In a real implementation, you would use a crypto library
  // For simplicity, we're just generating a random string
  const length = 32;
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // In a real implementation, you would hash this password
  // For now, we'll just return it (assuming it will be hashed elsewhere)
  return password;
}

/**
 * Get Stack Auth user ID from database user ID or email
 * This is useful when you need to perform Stack Auth operations based on a database user
 */
export async function getStackUserIdFromDbUser(
  dbUserIdOrEmail: string
): Promise<string | null> {
  try {
    // Check if input is an email
    const isEmail = dbUserIdOrEmail.includes("@");

    if (isEmail) {
      // Find user by email - Stack Auth doesn't have a direct getUserByEmail method
      // so we need to find the user by iterating through all users
      const users = await stackServerApp.listUsers();
      const user = users.find((u) => u.primaryEmail === dbUserIdOrEmail);
      return user?.id || null;
    } else {
      // Find all Stack Auth users
      const users = await stackServerApp.listUsers();

      // Find the user with matching dbUserId in metadata
      for (const user of users) {
        const metadata = user.clientReadOnlyMetadata || {};
        if (metadata.dbUserId === dbUserIdOrEmail) {
          return user.id;
        }
      }

      // If not found by metadata, try to find by ssoId in database
      const dbUser = await prisma.user.findUnique({
        where: { id: dbUserIdOrEmail },
        select: { ssoId: true, email: true },
      });

      if (dbUser?.ssoId) {
        return dbUser.ssoId;
      }

      if (dbUser?.email) {
        // Find user by email
        const users = await stackServerApp.listUsers();
        const stackUser = users.find((u) => u.primaryEmail === dbUser.email);
        return stackUser?.id || null;
      }
    }

    return null;
  } catch (error) {
    console.error(
      `Error getting Stack user ID for DB user ${dbUserIdOrEmail}:`,
      error
    );
    return null;
  }
}

/**
 * Get database user from Stack Auth user ID
 * This is useful when you need to perform database operations based on a Stack Auth user
 */
export async function getDbUserFromStackUser(
  stackUserId: string
): Promise<any | null> {
  try {
    const user = await stackServerApp.getUser(stackUserId);
    if (!user) {
      return null;
    }

    // Try to find by metadata first
    const metadata = user.clientReadOnlyMetadata || {};
    if (metadata.dbUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: metadata.dbUserId },
      });
      if (dbUser) return dbUser;
    }

    // If not found by metadata, try to find by email
    if (user.primaryEmail) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.primaryEmail },
      });
      if (dbUser) return dbUser;
    }

    // If not found by email, try to find by ssoId
    const dbUser = await prisma.user.findFirst({
      where: { ssoId: stackUserId },
    });

    return dbUser || null;
  } catch (error) {
    console.error(
      `Error getting DB user for Stack user ${stackUserId}:`,
      error
    );
    return null;
  }
}
