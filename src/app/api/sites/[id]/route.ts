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

    // Only allow access if user belongs to this site or is OWNER/ADMIN
    if (
      !["OWNER", "ADMIN"].includes(currentUser.role) &&
      currentUser.siteId !== params.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const site = await prisma.site.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
