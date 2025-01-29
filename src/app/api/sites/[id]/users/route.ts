import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site
    if (currentUser.role === "SITE_ADMIN" && currentUser.siteId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        siteId: params.id,
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site
    if (currentUser.role === "SITE_ADMIN" && currentUser.siteId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { email, name, password, role, departmentId, positionId } = data;

    // Validate required fields
    if (!email || !name || !password || !role || !departmentId || !positionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Site admins can only create regular users
    if (currentUser.role === "SITE_ADMIN" && role !== "USER") {
      return NextResponse.json(
        { error: "Site admins can only create regular users" },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        siteId: params.id,
        departmentId,
        positionId,
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site
    if (currentUser.role === "SITE_ADMIN" && currentUser.siteId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!targetUser || targetUser.siteId !== params.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Site admins can't modify other admins
    if (
      currentUser.role === "SITE_ADMIN" &&
      (targetUser.role !== "USER" || role !== "USER")
    ) {
      return NextResponse.json(
        { error: "Site admins can only modify regular users" },
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
    };

    // Only update password if provided
    if (password) {
      updateData.password = await hash(password, 10);
    }

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Allow ADMIN/OWNER access to any site, but SITE_ADMIN only to their site
    if (currentUser.role === "SITE_ADMIN" && currentUser.siteId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

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

    if (!targetUser || targetUser.siteId !== params.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Site admins can't delete other admins
    if (currentUser.role === "SITE_ADMIN" && targetUser.role !== "USER") {
      return NextResponse.json(
        { error: "Site admins can only delete regular users" },
        { status: 403 }
      );
    }

    // Instead of deleting, we'll deactivate the user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
