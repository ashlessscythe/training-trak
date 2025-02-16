import { getServerSession } from "next-auth/next";
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

    const trainings = await prisma.trainingProgress.findMany({
      where: {
        OR: [
          { user: { siteId: params.id } },
          { sop: { createdBy: { siteId: params.id } } },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            siteId: true,
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
        approvedBy: {
          select: {
            name: true,
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

    // Add approver info if status is changing to APPROVED
    if (status === "APPROVED") {
      updateData.approvedById = currentUser.id;
      updateData.approvedAt = new Date();
    }

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
          },
        },
        sop: {
          select: {
            name: true,
            version: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
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
