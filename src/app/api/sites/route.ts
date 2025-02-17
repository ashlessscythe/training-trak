import { getServerSession } from "next-auth/next";
export const dynamic = 'force-dynamic';
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
      select: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sites = await prisma.site.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
        users: {
          include: {
            _count: {
              select: {
                uploadedDocs: true,
                createdSOPs: true,
                trainings: {
                  where: {
                    status: "APPROVED",
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to include aggregated stats
    const sitesWithStats = sites.map((site) => ({
      ...site,
      stats: {
        totalUsers: site._count.users,
        activeUsers: site.users.filter((user) => user.isActive).length,
        totalDocuments: site.users.reduce(
          (sum, user) => sum + user._count.uploadedDocs,
          0
        ),
        totalSOPs: site.users.reduce(
          (sum, user) => sum + user._count.createdSOPs,
          0
        ),
        completedTrainings: site.users.reduce(
          (sum, user) => sum + user._count.trainings,
          0
        ),
      },
      // Remove the users array from the response to reduce payload size
      users: undefined,
    }));

    return NextResponse.json(sitesWithStats);
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
      select: { role: true },
    });

    if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const { code, name, description } = data;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const site = await prisma.site.create({
      data: {
        code,
        name,
        description,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
        users: {
          include: {
            _count: {
              select: {
                uploadedDocs: true,
                createdSOPs: true,
                trainings: {
                  where: {
                    status: "APPROVED",
                  },
                },
              },
            },
          },
        },
      },
    });

    const siteWithStats = {
      ...site,
      stats: {
        totalUsers: site._count.users,
        activeUsers: site.users.filter((user) => user.isActive).length,
        totalDocuments: site.users.reduce(
          (sum, user) => sum + user._count.uploadedDocs,
          0
        ),
        totalSOPs: site.users.reduce(
          (sum, user) => sum + user._count.createdSOPs,
          0
        ),
        completedTrainings: site.users.reduce(
          (sum, user) => sum + user._count.trainings,
          0
        ),
      },
      users: undefined,
    };

    return NextResponse.json(siteWithStats);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Site code already exists" },
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
    const { id, code, name, description, isActive } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      code,
      name,
      description,
      isActive,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const site = await prisma.site.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
          },
        },
        users: {
          include: {
            _count: {
              select: {
                uploadedDocs: true,
                createdSOPs: true,
                trainings: {
                  where: {
                    status: "APPROVED",
                  },
                },
              },
            },
          },
        },
      },
    });

    const siteWithStats = {
      ...site,
      stats: {
        totalUsers: site._count.users,
        activeUsers: site.users.filter((user) => user.isActive).length,
        totalDocuments: site.users.reduce(
          (sum, user) => sum + user._count.uploadedDocs,
          0
        ),
        totalSOPs: site.users.reduce(
          (sum, user) => sum + user._count.createdSOPs,
          0
        ),
        completedTrainings: site.users.reduce(
          (sum, user) => sum + user._count.trainings,
          0
        ),
      },
      users: undefined,
    };

    return NextResponse.json(siteWithStats);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Site code already exists" },
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
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    // Instead of deleting, we'll deactivate the site
    const site = await prisma.site.update({
      where: { id },
      data: { isActive: false },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
        users: {
          include: {
            _count: {
              select: {
                uploadedDocs: true,
                createdSOPs: true,
                trainings: {
                  where: {
                    status: "APPROVED",
                  },
                },
              },
            },
          },
        },
      },
    });

    const siteWithStats = {
      ...site,
      stats: {
        totalUsers: site._count.users,
        activeUsers: site.users.filter((user) => user.isActive).length,
        totalDocuments: site.users.reduce(
          (sum, user) => sum + user._count.uploadedDocs,
          0
        ),
        totalSOPs: site.users.reduce(
          (sum, user) => sum + user._count.createdSOPs,
          0
        ),
        completedTrainings: site.users.reduce(
          (sum, user) => sum + user._count.trainings,
          0
        ),
      },
      users: undefined,
    };

    return NextResponse.json(siteWithStats);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
