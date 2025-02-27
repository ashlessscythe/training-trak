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
      select: {
        id: true,
        role: true,
        siteId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      select: {
        content: true,
        name: true,
        metadata: true,
        siteId: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this document's site
    if (
      !["OWNER", "ADMIN"].includes(currentUser.role) &&
      document.siteId !== currentUser.siteId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create response with document content
    const response = new NextResponse(document.content);

    // Get content type from metadata if available
    const metadata = document.metadata as {
      mimeType?: string;
    } | null;
    const contentType = metadata?.mimeType || "application/octet-stream";

    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${document.name}"`
    );
    response.headers.set("Content-Type", contentType);

    return response;
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
