import { getServerSession } from "next-auth/next";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    // Get query params if present
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const sopId = searchParams.get("sopId");

    // Build where clause
    const whereClause: any = {};

    // Add filters if provided
    if (status || sopId) {
      whereClause.AND = [];

      if (status) {
        whereClause.AND.push({ status });
      }

      if (sopId) {
        whereClause.AND.push({ sopId });
      }
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

export async function PUT(req: NextRequest) {
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
