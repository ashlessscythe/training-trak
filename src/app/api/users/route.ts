import { getServerSession } from "next-auth/next";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
import { EmailService } from "@/lib/email";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
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
          site: {
            name: "asc",
          },
        },
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
      select: { role: true, siteId: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const {
      email,
      name,
      password,
      role,
      siteId,
      departmentId,
      positionId,
      shift,
      ssoId,
    } = data;

    // Validate required fields
    if (
      !email ||
      !name ||
      !password ||
      !role ||
      !siteId ||
      !departmentId ||
      !positionId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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
        siteId,
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
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const {
      id,
      email,
      name,
      role,
      siteId,
      departmentId,
      positionId,
      isActive,
      password,
      shift,
      ssoId,
    } = data;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      email,
      name,
      role,
      siteId,
      departmentId,
      positionId,
      isActive,
      shift,
      ssoId,
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
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Instead of deleting, we'll deactivate the user
    const user = await prisma.user.update({
      where: { id },
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
