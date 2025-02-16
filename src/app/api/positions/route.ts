import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !["OWNER", "ADMIN"].includes(session.user?.role || "")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true, siteId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If user is OWNER or ADMIN, they can see all positions
    // Otherwise, only show positions from their site
    const positions = await prisma.position.findMany({
      where: {
        isActive: true,
        ...(["OWNER", "ADMIN"].includes(currentUser.role)
          ? {}
          : {
              site: {
                id: currentUser.siteId,
              },
            }),
      },
      orderBy: { name: "asc" },
      include: {
        site: true,
      },
    });
    return NextResponse.json(positions);
  } catch (error) {
    console.error("Failed to fetch positions", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

// Only GET endpoint is needed for admin interface
