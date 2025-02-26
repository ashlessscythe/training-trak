import { PrismaClient } from "@prisma/client";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { EmailService } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and has admin privileges
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["ADMIN", "SITE_ADMIN", "OWNER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true, siteId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { userId, role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Find the user to approve
    const userToApprove = await prisma.user.findUnique({
      where: { id: userId },
      include: { site: true },
    });

    if (!userToApprove) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Site admins can only approve users in their own site
    if (
      currentUser.role === "SITE_ADMIN" &&
      userToApprove.siteId !== currentUser.siteId
    ) {
      return NextResponse.json(
        { error: "You can only approve users in your own site" },
        { status: 403 }
      );
    }

    // Site admins can only set roles below admin level
    if (
      currentUser.role === "SITE_ADMIN" &&
      role &&
      ["ADMIN", "OWNER", "SITE_ADMIN"].includes(role)
    ) {
      return NextResponse.json(
        { error: "Site admins can only set roles below admin level" },
        { status: 403 }
      );
    }

    // Check if user is already approved (not in PENDING state)
    if (userToApprove.role !== "PENDING") {
      return NextResponse.json(
        { error: "User is already approved" },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role || "USER", // Default to USER role if not specified
      },
      include: { site: true },
    });

    // Send account approval email
    try {
      await EmailService.sendAccountApprovalEmail(
        updatedUser,
        updatedUser.site
      );
      console.log(`Account approval email sent to ${updatedUser.email}`);
    } catch (emailError) {
      console.error("Failed to send account approval email:", emailError);
      // Continue with the approval process even if email sending fails
    }

    return NextResponse.json({
      message: "User approved successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
