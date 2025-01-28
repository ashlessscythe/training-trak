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
          },
        },
        lastModifiedBy: {
          select: {
            name: true,
            email: true,
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
      !["OWNER", "ADMIN", "SUPERVISOR"].includes(currentUser.role)
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
          },
        },
        lastModifiedBy: {
          select: {
            name: true,
            email: true,
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
      !["OWNER", "ADMIN", "SUPERVISOR"].includes(currentUser.role)
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
          },
        },
        lastModifiedBy: {
          select: {
            name: true,
            email: true,
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

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "SOP ID is required" },
        { status: 400 }
      );
    }

    // Instead of deleting, we'll deactivate the SOP
    const sop = await prisma.sOP.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(sop);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
