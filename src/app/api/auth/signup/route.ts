import { PrismaClient } from "@prisma/client";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { EmailService } from "@/lib/email";
import { stackServerApp } from "@/stack";

const prisma = new PrismaClient();

// Function to get admin and site admin emails
async function getAdminEmails(siteId: string) {
  // Get all ADMIN users
  const adminUsers = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      isActive: true,
    },
    select: {
      email: true,
    },
  });

  // Get SITE_ADMIN users for the specific site
  const siteAdminUsers = await prisma.user.findMany({
    where: {
      role: "SITE_ADMIN",
      siteId: siteId,
      isActive: true,
    },
    select: {
      email: true,
    },
  });

  // Combine and return unique emails
  const allEmails = [
    ...adminUsers.map((user) => user.email),
    ...siteAdminUsers.map((user) => user.email),
  ];

  // Remove duplicates if any
  return [...new Set(allEmails)];
}

export async function POST(request: Request) {
  try {
    const { email, name, siteId } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists in Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Get default site if siteId not provided
    let userSiteId = siteId;
    let site;

    if (!userSiteId) {
      const defaultSite = await prisma.site.findFirst({
        where: { code: "DEFAULT" },
      });

      if (!defaultSite) {
        return NextResponse.json(
          { error: "Default site not found" },
          { status: 500 }
        );
      }

      userSiteId = defaultSite.id;
      site = defaultSite;
    } else {
      site = await prisma.site.findUnique({
        where: { id: userSiteId },
      });

      if (!site) {
        return NextResponse.json({ error: "Site not found" }, { status: 400 });
      }
    }

    // Get default dept
    const defaultDept = await prisma.department.findFirst({
      where: { name: "DEFAULT_DEPT" },
    });

    if (!defaultDept) {
      return NextResponse.json(
        { error: "Default department not found" },
        { status: 500 }
      );
    }

    const defaultPosition = await prisma.position.findFirst({
      where: { name: "DEFAULT_POSITION" },
    });

    if (!defaultPosition) {
      return NextResponse.json(
        { error: "Default position not found" },
        { status: 500 }
      );
    }

    // Create user in Prisma with PENDING role and default position/dept
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: "", // Password is managed by Stack Auth
        siteId: userSiteId,
        role: "PENDING",
        departmentId: defaultDept.id,
        positionId: defaultPosition.id,
        shift: "FIRST", // Default to FIRST shift
        ssoId: null, // Default to null for ssoId
      },
      include: {
        site: true,
      },
    });

    // Send registration email to the user
    try {
      await EmailService.sendRegistrationEmail(user, user.site);
      console.log(`Registration email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send registration email:", emailError);
      // Continue with the registration process even if email sending fails
    }

    // Send notification to admins and site admins
    try {
      const adminEmails = await getAdminEmails(user.siteId);
      if (adminEmails.length > 0) {
        await EmailService.sendAdminNotificationEmail(
          user,
          user.site,
          adminEmails
        );
        console.log(
          `Admin notification emails sent to ${adminEmails.length} recipients`
        );
      } else {
        console.log("No admin or site admin users found to notify");
      }
    } catch (notificationError) {
      console.error(
        "Failed to send admin notification emails:",
        notificationError
      );
      // Continue with the registration process even if notification emails fail
    }

    // Return only necessary user data in the response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      site: {
        id: user.site.id,
        name: user.site.name,
        code: user.site.code,
      },
    };

    return NextResponse.json(userResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
