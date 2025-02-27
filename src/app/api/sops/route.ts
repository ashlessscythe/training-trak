import { getServerSession } from "next-auth/next";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, siteId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If user is OWNER or ADMIN, they can see all SOPs
    // Otherwise, only show SOPs from their site
    const sops = await prisma.sOP.findMany({
      where: !["OWNER", "ADMIN"].includes(currentUser.role)
        ? {
            createdBy: {
              site: {
                id: currentUser.siteId,
              },
            },
          }
        : undefined,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            site: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        lastModifiedBy: {
          select: {
            name: true,
            email: true,
            site: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          name: "asc",
        },
        {
          version: "desc",
        },
      ],
    });

    return NextResponse.json(sops);
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
    });

    // Allow OWNER, ADMIN, SITE_ADMIN, and SUPERVISOR roles to create SOPs
    // But SITE_ADMIN and SUPERVISOR can only create for their site
    if (
      !currentUser ||
      !["OWNER", "ADMIN", "SITE_ADMIN", "SUPERVISOR"].includes(currentUser.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For SITE_ADMIN and SUPERVISOR, ensure they can only create SOPs for their site
    if (
      ["SITE_ADMIN", "SUPERVISOR"].includes(currentUser.role) &&
      !currentUser.siteId
    ) {
      return NextResponse.json(
        { error: "User must be assigned to a site" },
        { status: 403 }
      );
    }

    const data = await req.json();
    const { name, description, version, content, requiredRoles, isCritical } =
      data;

    // Validate required fields
    if (!name || !version) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const sop = await prisma.sOP.create({
      data: {
        name,
        description,
        version,
        content,
        requiredRoles,
        isCritical: isCritical || false,
        isActive: true,
        createdById: currentUser.id,
        lastModifiedById: currentUser.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            site: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        lastModifiedBy: {
          select: {
            name: true,
            email: true,
            site: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(sop);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "SOP with this name and version already exists" },
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
    });

    // Allow OWNER, ADMIN, SITE_ADMIN, and SUPERVISOR roles to edit SOPs
    // But SITE_ADMIN and SUPERVISOR can only edit SOPs from their site
    if (
      !currentUser ||
      !["OWNER", "ADMIN", "SITE_ADMIN", "SUPERVISOR"].includes(currentUser.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const {
      id,
      name,
      description,
      version,
      content,
      requiredRoles,
      isActive,
      isCritical,
    } = data;

    if (!id) {
      return NextResponse.json(
        { error: "SOP ID is required" },
        { status: 400 }
      );
    }

    // Get the SOP to check site permissions
    const existingSop = await prisma.sOP.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            site: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!existingSop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    // For SITE_ADMIN and SUPERVISOR, ensure they can only edit SOPs from their site
    if (
      ["SITE_ADMIN", "SUPERVISOR"].includes(currentUser.role) &&
      currentUser.siteId !== existingSop.createdBy.site.id
    ) {
      return NextResponse.json(
        { error: "Cannot edit SOPs from other sites" },
        { status: 403 }
      );
    }

    const updateData: any = {
      name,
      description,
      version,
      content,
      requiredRoles,
      isActive,
      isCritical,
      lastModifiedById: currentUser.id,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const sop = await prisma.sOP.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            site: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        lastModifiedBy: {
          select: {
            name: true,
            email: true,
            site: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(sop);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "SOP with this name and version already exists" },
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
    });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "SOP ID is required" },
        { status: 400 }
      );
    }

    // Get the SOP to check permissions
    const sop = await prisma.sOP.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            site: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!sop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    // Allow OWNER, ADMIN, SITE_ADMIN, and SUPERVISOR roles to delete SOPs
    // But SITE_ADMIN and SUPERVISOR can only delete SOPs from their site
    if (
      !currentUser ||
      !["OWNER", "ADMIN", "SITE_ADMIN", "SUPERVISOR"].includes(currentUser.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For SITE_ADMIN and SUPERVISOR, ensure they can only delete SOPs from their site
    if (
      ["SITE_ADMIN", "SUPERVISOR"].includes(currentUser.role) &&
      currentUser.siteId !== sop.createdBy.site.id
    ) {
      return NextResponse.json(
        { error: "Cannot delete SOPs from other sites" },
        { status: 403 }
      );
    }

    // Instead of deleting, we'll deactivate the SOP
    const updatedSop = await prisma.sOP.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(updatedSop);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
