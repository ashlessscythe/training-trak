import { getServerSession } from "next-auth/next";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
import { EmailService } from "@/lib/email";
import { getIdFromReq } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        role: true,
        siteId: true,
        adminSites: {
          select: { siteId: true },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site(s)
    const siteId = getIdFromReq(req);
    if (currentUser.role === "SITE_ADMIN") {
      const hasAccess =
        currentUser.siteId === siteId ||
        currentUser.adminSites.some((adminSite) => adminSite.siteId === siteId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const users = await prisma.user.findMany({
      where: {
        siteId: siteId,
      },
      include: {
        site: true,
        department: true,
        position: true,
        trainings: {
          select: {
            status: true,
          },
        },
        uploadedDocs: {
          select: {
            id: true,
          },
        },
        createdSOPs: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        {
          role: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        role: true,
        siteId: true,
        adminSites: {
          select: { siteId: true },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site(s)
    const reqSiteId = getIdFromReq(req);
    if (currentUser.role === "SITE_ADMIN") {
      const hasAccess =
        currentUser.siteId === reqSiteId ||
        currentUser.adminSites.some(
          (adminSite) => adminSite.siteId === reqSiteId
        );
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const data = await req.json();
    const {
      email,
      name,
      password,
      role,
      departmentId,
      positionId,
      siteId,
      shift,
      ssoId,
    } = data;

    // Validate required fields
    if (!email || !name || !password || !role || !departmentId || !positionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Site admins can only create users with roles below ADMIN (PENDING, USER, SUPERVISOR)
    if (
      currentUser.role === "SITE_ADMIN" &&
      ["ADMIN", "OWNER", "SITE_ADMIN"].includes(role)
    ) {
      return NextResponse.json(
        {
          error:
            "Site admins can only create users with roles below admin level",
        },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Use the siteId from the request body if provided, otherwise use the site ID from the URL
    const userSiteId = siteId || reqSiteId;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        siteId: userSiteId,
        departmentId,
        positionId,
        shift,
        ssoId,
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

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        role: true,
        siteId: true,
        adminSites: {
          select: { siteId: true },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site(s)
    const reqSiteId = getIdFromReq(req);
    if (currentUser.role === "SITE_ADMIN") {
      const hasAccess =
        currentUser.siteId === reqSiteId ||
        currentUser.adminSites.some(
          (adminSite) => adminSite.siteId === reqSiteId
        );
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const data = await req.json();
    const {
      id,
      email,
      name,
      role,
      departmentId,
      positionId,
      isActive,
      password,
      siteId,
      shift,
      ssoId,
    } = data;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user belongs to this site
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { siteId: true, role: true },
    });

    if (!targetUser || targetUser.siteId !== reqSiteId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Site admins can only modify users with roles below ADMIN (PENDING, USER, SUPERVISOR)
    if (
      currentUser.role === "SITE_ADMIN" &&
      (["ADMIN", "OWNER", "SITE_ADMIN"].includes(targetUser.role) ||
        (role && ["ADMIN", "OWNER", "SITE_ADMIN"].includes(role)))
    ) {
      return NextResponse.json(
        {
          error:
            "Site admins can only modify users with roles below admin level",
        },
        { status: 403 }
      );
    }

    const updateData: any = {
      email,
      name,
      role,
      departmentId,
      positionId,
      isActive,
      shift,
      ssoId,
      // Use the siteId from the request body if provided, otherwise don't change it
      ...(siteId && { siteId }),
    };

    // Only update password if provided
    if (password) {
      updateData.password = await hash(password, 10);
    }

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Get the user before update to check if role is changing from PENDING
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { site: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { site: true },
    });

    // If user role is changing from PENDING to another role, send approval email
    if (existingUser.role === "PENDING" && user.role !== "PENDING") {
      try {
        await EmailService.sendAccountApprovalEmail(user, user.site);
        console.log(`Account approval email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send account approval email:", emailError);
        // Continue with the update process even if email sending fails
      }
    }

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

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        role: true,
        siteId: true,
        adminSites: {
          select: { siteId: true },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site(s)
    const reqSiteId = getIdFromReq(req);
    if (currentUser.role === "SITE_ADMIN") {
      const hasAccess =
        currentUser.siteId === reqSiteId ||
        currentUser.adminSites.some(
          (adminSite) => adminSite.siteId === reqSiteId
        );
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user belongs to this site
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { siteId: true, role: true },
    });

    if (!targetUser || targetUser.siteId !== reqSiteId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Site admins can only delete users with roles below ADMIN (PENDING, USER, SUPERVISOR)
    if (
      currentUser.role === "SITE_ADMIN" &&
      ["ADMIN", "OWNER", "SITE_ADMIN"].includes(targetUser.role)
    ) {
      return NextResponse.json(
        {
          error:
            "Site admins can only delete users with roles below admin level",
        },
        { status: 403 }
      );
    }

    // Only OWNER and ADMIN can permanently delete users
    if (permanent) {
      if (!["OWNER", "ADMIN"].includes(currentUser.role)) {
        return NextResponse.json(
          { error: "Only OWNER and ADMIN can permanently delete users" },
          { status: 403 }
        );
      }

      // Prevent deleting OWNER or ADMIN users (safety check)
      if (["OWNER", "ADMIN"].includes(targetUser.role)) {
        return NextResponse.json(
          { error: "Cannot delete users with OWNER or ADMIN roles" },
          { status: 403 }
        );
      }

      // Unlink/reassign related records instead of deleting them
      await prisma.$transaction(async (tx) => {
        // Get the user's name before deletion for traceability
        const userToDelete = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });

        if (!userToDelete) {
          throw new Error("User not found");
        }

        // Find an admin user to reassign records to
        const adminUser = await tx.user.findFirst({
          where: { role: { in: ["OWNER", "ADMIN"] }, isActive: true },
          select: { id: true },
        });

        if (!adminUser) {
          throw new Error(
            "Cannot delete user: No admin user available to reassign records"
          );
        }

        // Delete SiteAdmin records (these are just role assignments)
        await tx.siteAdmin.deleteMany({
          where: { userId: userId },
        });

        // Get all training progress records to update with original user info
        const trainingRecords = await tx.trainingProgress.findMany({
          where: { userId: userId },
          select: { id: true, notes: true },
        });

        // Reassign TrainingProgress records to admin user and preserve original user info in notes
        const deletionNote = `[Original trainee: ${userToDelete.name} (${userToDelete.email}) - User deleted on ${new Date().toISOString().split("T")[0]}]`;

        for (const training of trainingRecords) {
          const updatedNotes = training.notes
            ? `${training.notes}\n\n${deletionNote}`
            : deletionNote;

          await tx.trainingProgress.update({
            where: { id: training.id },
            data: {
              userId: adminUser.id,
              notes: updatedNotes,
            },
          });
        }

        // Reassign Documents uploaded by this user to admin user (preserve documents)
        await tx.document.updateMany({
          where: { uploadedById: userId },
          data: { uploadedById: adminUser.id },
        });

        // Reassign SOPs created by this user to admin user
        await tx.sOP.updateMany({
          where: { createdById: userId },
          data: { createdById: adminUser.id },
        });

        // Reassign SOPs last modified by this user to admin user
        await tx.sOP.updateMany({
          where: { lastModifiedById: userId },
          data: { lastModifiedById: adminUser.id },
        });

        // Finally, delete the user
        await tx.user.delete({
          where: { id: userId },
        });
      });

      return NextResponse.json({ id: userId, deleted: true });
    }

    // Soft delete (deactivate) the user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error deleting user:", error);

    // Handle Prisma foreign key constraint errors
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Cannot delete user: User has related records that must be removed first",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
