import { getServerSession } from "next-auth/next";
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

    const sops = await prisma.sOP.findMany({
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            siteId: true,
          },
        },
        lastModifiedBy: {
          select: {
            name: true,
            email: true,
            siteId: true,
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

    if (
      !currentUser ||
      !["OWNER", "ADMIN", "SITE_ADMIN", "SUPERVISOR"].includes(currentUser.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { name, description, version, content, requiredRoles } = data;

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
        isActive: true,
        createdById: currentUser.id,
        lastModifiedById: currentUser.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            siteId: true,
          },
        },
        lastModifiedBy: {
          select: {
            name: true,
            email: true,
            siteId: true,
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

    if (
      !currentUser ||
      !["OWNER", "ADMIN", "SITE_ADMIN", "SUPERVISOR"].includes(currentUser.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { id, name, description, version, content, requiredRoles, isActive } =
      data;

    if (!id) {
      return NextResponse.json(
        { error: "SOP ID is required" },
        { status: 400 }
      );
    }

    // Get the SOP to check site permissions for site admin
    const existingSop = await prisma.sOP.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { siteId: true },
        },
      },
    });

    if (!existingSop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    // Check if site admin has permission for this SOP
    if (
      currentUser.role === "SITE_ADMIN" &&
      currentUser.siteId !== existingSop.createdBy.siteId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {
      name,
      description,
      version,
      content,
      requiredRoles,
      isActive,
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
            siteId: true,
          },
        },
        lastModifiedBy: {
          select: {
            name: true,
            email: true,
            siteId: true,
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
          select: { siteId: true },
        },
      },
    });

    if (!sop) {
      return NextResponse.json({ error: "SOP not found" }, { status: 404 });
    }

    // Check permissions
    if (
      !currentUser ||
      (!["OWNER", "ADMIN"].includes(currentUser.role) &&
        !(
          currentUser.role === "SITE_ADMIN" &&
          currentUser.siteId === sop.createdBy.siteId
        ))
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
