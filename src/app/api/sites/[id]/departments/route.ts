import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const id = request.nextUrl.pathname.split("/")[3];

    const departments = await prisma.department.findMany({
      where: {
        site: {
          id: id,
        },
      },
      orderBy: {
        name: "asc",
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    const id = request.nextUrl.pathname.split("/")[3];

    const department = await prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: true,
        site: {
          connect: { id },
        },
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(department);
  } catch (error: any) {
    console.error("Failed to create department:", error);
    if (error.code === "P2002") {
      return new NextResponse("Department name already exists for this site", {
        status: 400,
      });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    const id = request.nextUrl.pathname.split("/")[3];

    const department = await prisma.department.update({
      where: {
        id: data.id,
        site: {
          id: id,
        },
      },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(department);
  } catch (error: any) {
    console.error("Failed to update department:", error);
    if (error.code === "P2002") {
      return new NextResponse("Department name already exists for this site", {
        status: 400,
      });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("id");

    if (!departmentId) {
      return new NextResponse("Department ID is required", { status: 400 });
    }

    const id = request.nextUrl.pathname.split("/")[3];

    const department = await prisma.department.delete({
      where: {
        id: departmentId,
        site: {
          id: id,
        },
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Failed to delete department:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
