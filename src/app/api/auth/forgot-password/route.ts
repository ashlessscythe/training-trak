import { PrismaClient } from "@prisma/client";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { EmailService } from "@/lib/email";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { site: true },
    });

    // Don't reveal that the user doesn't exist for security reasons
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If your email exists in our system, you will receive a password reset link",
        },
        { status: 200 }
      );
    }

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set token expiration (1 hour from now)
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    // Save the token and expiration to the user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Send the password reset email
    try {
      await EmailService.sendPasswordResetEmail(user, resetToken);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Continue with the process even if email sending fails
      // In a production environment, you might want to handle this differently
    }

    return NextResponse.json({
      success: true,
      message:
        "If your email exists in our system, you will receive a password reset link",
    });
  } catch (error: any) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}
