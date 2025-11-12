import { getServerSession } from "next-auth/next";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIdFromReq } from "@/lib/utils";

async function checkUserAccess(siteId: string, requiresWrite = false) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, siteId: true, isActive: true },
  });

  if (!currentUser) {
    return { error: "Forbidden", status: 403 };
  }

  // Block inactive users from accessing any API routes
  if (!currentUser.isActive) {
    return { error: "Account has been deactivated", status: 403 };
  }

  // Block PENDING users from accessing any API routes
  if (currentUser.role === "PENDING") {
    return { error: "Account pending approval", status: 403 };
  }

  // Only allow access if user belongs to this site or is OWNER/ADMIN
  if (
    !["OWNER", "ADMIN"].includes(currentUser.role) &&
    currentUser.siteId !== siteId
  ) {
    return { error: "Forbidden", status: 403 };
  }

  // For write operations, check additional role requirements
  if (
    requiresWrite &&
    !["OWNER", "ADMIN", "SITE_ADMIN", "SUPERVISOR"].includes(currentUser.role)
  ) {
    return { error: "Insufficient permissions", status: 403 };
  }

  return { currentUser };
}

export async function GET(request: NextRequest) {
  try {
    const siteId = getIdFromReq(request);
    const access = await checkUserAccess(siteId);
    if ("error" in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    // Get SOPs for this site
    const sops = await prisma.sOP.findMany({
      where: {
        OR: [
          {
            createdBy: {
              site: {
                id: siteId,
              },
            },
          },
          {
            lastModifiedBy: {
              site: {
                id: siteId,
              },
            },
          },
        ],
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
        positions: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
        documents: {
          where: {
            uploadedBy: {
              site: {
                id: siteId,
              },
            },
          },
          select: {
            id: true,
            name: true,
            type: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
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
    const siteId = getIdFromReq(req);
    const access = await checkUserAccess(siteId, true);
    if ("error" in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }
    const { currentUser } = access;

    const data = await req.json();
    const {
      name,
      description,
      version,
      content,
      requiredRoles,
      positionIds,
      isCritical,
    } = data;

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
        positions: positionIds?.length
          ? {
              connect: positionIds.map((id: string) => ({ id })),
            }
          : undefined,
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
        positions: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        documents: {
          where: {
            uploadedBy: {
              site: {
                id: siteId,
              },
            },
          },
          select: {
            id: true,
            name: true,
            type: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
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
    const siteId = getIdFromReq(req);
    const access = await checkUserAccess(siteId, true);
    if ("error" in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }
    const { currentUser } = access;

    const data = await req.json();
    const {
      id,
      name,
      description,
      version,
      content,
      requiredRoles,
      positionIds,
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
        positions: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!existingSop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    // Verify the SOP belongs to this site
    if (existingSop.createdBy.site.id !== siteId) {
      return NextResponse.json(
        { error: "SOP does not belong to this site" },
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
      positions: {
        set: positionIds?.map((id: string) => ({ id })) || [],
      },
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
        positions: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
        documents: {
          where: {
            uploadedBy: {
              site: {
                id: siteId,
              },
            },
          },
          select: {
            id: true,
            name: true,
            type: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
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
    const siteId = getIdFromReq(req);
    const access = await checkUserAccess(siteId, true);
    if ("error" in access) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

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

    // Verify the SOP belongs to this site
    if (sop.createdBy.site.id !== siteId) {
      return NextResponse.json(
        { error: "SOP does not belong to this site" },
        { status: 403 }
      );
    }

    // Instead of deleting, we'll deactivate the SOP
    const updatedSop = await prisma.sOP.update({
      where: { id },
      data: { isActive: false },
      include: {
        positions: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSop);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
