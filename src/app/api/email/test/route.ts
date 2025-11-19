import { getServerSession } from "next-auth/next";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { EmailService, EmailType } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and has admin privileges
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (
      !currentUser ||
      !["OWNER", "ADMIN", "SITE_ADMIN"].includes(currentUser.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, to, params } = body;

    if (!type || !to) {
      return NextResponse.json(
        { error: "Missing required fields: type and to" },
        { status: 400 }
      );
    }

    // Validate email type
    const validTypes: EmailType[] = [
      "registration",
      "account-approval",
      "password-reset",
      "admin-notification",
    ];
    if (!validTypes.includes(type as EmailType)) {
      return NextResponse.json(
        { error: "Invalid email type" },
        { status: 400 }
      );
    }

    // Send test email
    const result = await EmailService.sendTestEmail(
      type as EmailType,
      to,
      params || {}
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Test email sent successfully",
      emailId: result.data?.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

