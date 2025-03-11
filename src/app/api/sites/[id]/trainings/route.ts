import { getServerSession } from "next-auth/next";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: params.id },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get query params if present
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const sopId = searchParams.get("sopId");

    // Build where clause
    const whereClause: any = {
      AND: [
        // Only show trainings where the user belongs to this site
        { user: { siteId: params.id } },
      ],
    };

    // Add filters if provided
    if (userId) {
      whereClause.AND.push({ userId });
    }

    if (status) {
      whereClause.AND.push({ status });
    }

    if (sopId) {
      whereClause.AND.push({ sopId });
    }

    const trainings = await prisma.trainingProgress.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            siteId: true,
            department: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
        sop: {
          select: {
            name: true,
            version: true,
            createdBy: {
              select: {
                siteId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(trainings);
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

    // Only allow site admins, admins, and owners to assign training
    if (
      !["SITE_ADMIN", "ADMIN", "OWNER"].includes(currentUser.role) ||
      (currentUser.role === "SITE_ADMIN" && currentUser.siteId !== params.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { userId, sopIds } = data;

    if (!userId || !sopIds || !Array.isArray(sopIds) || sopIds.length === 0) {
      return NextResponse.json(
        { error: "User ID and at least one SOP ID are required" },
        { status: 400 }
      );
    }

    // Verify user belongs to this site
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { siteId: true },
    });

    if (!user || user.siteId !== params.id) {
      return NextResponse.json(
        { error: "User not found or not in this site" },
        { status: 404 }
      );
    }

    // Create training records for each SOP
    const trainings = await prisma.$transaction(
      sopIds.map((sopId) =>
        prisma.trainingProgress.create({
          data: {
            userId,
            sopId,
            status: "IN_PROGRESS",
          },
          include: {
            user: {
              select: {
                name: true,
                siteId: true,
                department: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
            sop: {
              select: {
                name: true,
                version: true,
                createdBy: {
                  select: {
                    siteId: true,
                  },
                },
              },
            },
          },
        })
      )
    );

    return NextResponse.json(trainings);
  } catch (error) {
    console.error("Error creating training assignments:", error);
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
      select: { id: true, role: true, siteId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { id, status, notes } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Training ID is required" },
        { status: 400 }
      );
    }

    // Get the training record to check permissions
    const training = await prisma.trainingProgress.findUnique({
      where: { id },
      include: {
        user: {
          select: { siteId: true },
        },
      },
    });

    if (!training) {
      return NextResponse.json(
        { error: "Training record not found" },
        { status: 404 }
      );
    }

    // Verify the training belongs to this site
    if (training.user.siteId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow site admins, admins, and owners to update training records
    if (
      !["SITE_ADMIN", "ADMIN", "OWNER"].includes(currentUser.role) ||
      (currentUser.role === "SITE_ADMIN" &&
        training.user.siteId !== currentUser.siteId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {
      status,
      notes,
    };

    // Add completion date if status is changing to COMPLETED
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    const updatedTraining = await prisma.trainingProgress.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            siteId: true,
            department: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
        sop: {
          select: {
            name: true,
            version: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTraining);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
