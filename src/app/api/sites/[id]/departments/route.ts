import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkUserAccess(siteId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      adminSites: {
        select: {
          siteId: true
        }
      }
    }
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

  // Allow OWNER and ADMIN to access any site
  if (["OWNER", "ADMIN"].includes(currentUser.role)) {
    return { currentUser };
  }

  // For SITE_ADMIN, check if they have access to this site
  if (currentUser.role === "SITE_ADMIN") {
    const hasAccess = currentUser.adminSites?.some(site => site.siteId === siteId);
    if (!hasAccess) {
      return { error: "Forbidden", status: 403 };
    }
    return { currentUser };
  }

  // For other roles, check if they belong to this site
  if (currentUser.siteId !== siteId) {
    return { error: "Forbidden", status: 403 };
  }

  return { currentUser };
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/")[3];
    const { error, status } = await checkUserAccess(id);
    
    if (error) {
      return new NextResponse(error, { status });
    }

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
    const id = request.nextUrl.pathname.split("/")[3];
    const { error, status } = await checkUserAccess(id);
    
    if (error) {
      return new NextResponse(error, { status });
    }

    const data = await request.json();

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
    const id = request.nextUrl.pathname.split("/")[3];
    const { error, status } = await checkUserAccess(id);
    
    if (error) {
      return new NextResponse(error, { status });
    }

    const data = await request.json();

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
    const id = request.nextUrl.pathname.split("/")[3];
    const { error, status } = await checkUserAccess(id);
    
    if (error) {
      return new NextResponse(error, { status });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("id");

    if (!departmentId) {
      return new NextResponse("Department ID is required", { status: 400 });
    }

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
