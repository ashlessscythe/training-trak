import { NextRequest, NextResponse } from "next/server";
import {
  handleNewUserRegistration,
  handleUserApproval,
} from "@/lib/stack-auth-integration";
import { bootstrapTeamsAndPermissions } from "@/lib/stack-bootstrap";
import { setupPendingUserPermissions } from "@/lib/stack-bootstrap";
import prisma from "@/lib/prisma";
import { stackServerApp } from "@/stack";

// Initialize Stack Auth on server startup
bootstrapTeamsAndPermissions().catch(console.error);

/**
 * Webhook handler for Stack Auth events
 * This endpoint can be configured in the Stack Auth dashboard to receive events
 * such as user registration, login, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (in a production environment)
    // const signature = request.headers.get('x-stack-signature');
    // if (!verifySignature(signature, await request.text())) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const data = await request.json();
    const { event, user } = data;

    console.log(`Received Stack Auth webhook: ${event}`);

    // Handle different event types
    switch (event) {
      case "user.created":
        // New user registration
        await handleNewUserRegistration(user.id);
        break;

      case "user.login":
        // User login - check if this is an OAuth user that needs pending status
        if (user.oauthProviders && user.oauthProviders.length > 0) {
          // Get the user to check their current status
          const stackUser = await stackServerApp.getUser(user.id);

          // If user doesn't have a status in metadata, they're likely a new OAuth user
          if (stackUser && !stackUser.clientReadOnlyMetadata?.status) {
            console.log(
              `New OAuth user detected: ${user.id}. Setting up pending permissions.`
            );
            await setupPendingUserPermissions(user.id);
          }
        }
        console.log(`User login: ${user.id}`);
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Example of how to handle user approval
 * This would typically be called from an admin dashboard
 */
export async function approveUser(
  stackUserId: string,
  role: string,
  siteId: string,
  departmentId: string,
  positionId: string
) {
  try {
    await handleUserApproval(
      stackUserId,
      role,
      siteId,
      departmentId,
      positionId
    );
    return { success: true };
  } catch (error) {
    console.error("Error approving user:", error);
    return { success: false, error: (error as Error).message };
  }
}
