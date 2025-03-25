import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIdFromReq } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the site ID using our utility function
    const siteId = getIdFromReq(request);
    if (!siteId) {
      return new NextResponse("Site ID is required", { status: 400 });
    }

    const positions = await prisma.position.findMany({
      where: {
        site: {
          id: siteId,
        },
      },
      orderBy: {
        name: "asc",
      },
      include: {
        site: true,
        sops: {
          select: {
            id: true,
            name: true,
            version: true,
            description: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error("Failed to fetch positions:", error);
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

    const siteId = getIdFromReq(request);
    const position = await prisma.position.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: true,
        site: {
          connect: { id: siteId },
        },
        sops: data.sopIds?.length
          ? {
              connect: data.sopIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        site: true,
        sops: {
          select: {
            id: true,
            name: true,
            version: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(position);
  } catch (error: any) {
    console.error("Failed to create position:", error);
    if (error.code === "P2002") {
      return new NextResponse("Position name already exists for this site", {
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
    const siteId = getIdFromReq(request);

    const position = await prisma.position.update({
      where: {
        id: data.id,
        site: {
          id: siteId,
        },
      },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        sops: {
          set: data.sopIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        site: true,
        sops: {
          select: {
            id: true,
            name: true,
            version: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(position);
  } catch (error: any) {
    console.error("Failed to update position:", error);
    if (error.code === "P2002") {
      return new NextResponse("Position name already exists for this site", {
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
    const positionId = searchParams.get("id");

    if (!positionId) {
      return new NextResponse("Position ID is required", { status: 400 });
    }

    const siteId = getIdFromReq(request);
    const position = await prisma.position.delete({
      where: {
        id: positionId,
        site: {
          id: siteId,
        },
      },
      include: {
        site: true,
        sops: {
          select: {
            id: true,
            name: true,
            version: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(position);
  } catch (error) {
    console.error("Failed to delete position:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
