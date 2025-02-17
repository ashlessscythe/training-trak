import { getServerSession } from "next-auth/next";
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DocumentType } from "@prisma/client";

export async function GET() {
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

    // If user is OWNER or ADMIN, they can see all documents
    // Otherwise, they can only see documents from their site
    const documents = await prisma.document.findMany({
      where: {
        uploadedBy: {
          siteId: !["OWNER", "ADMIN"].includes(currentUser.role)
            ? currentUser.siteId
            : undefined,
        },
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true,
            siteId: true,
          },
        },
        sop: {
          select: {
            name: true,
            version: true,
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json(documents);
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
      select: {
        id: true,
        role: true,
        siteId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("content") as File;
    const name = file.name;
    const type = formData.get("type") as DocumentType;
    const metadataStr = formData.get("metadata") as string;
    const metadata = {
      ...JSON.parse(metadataStr),
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
    };
    const sopId = formData.get("sopId") as string;

    // Validate required fields
    if (!name || !type || !file) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert file to bytes
    const arrayBuffer = await file.arrayBuffer();
    const content = Buffer.from(arrayBuffer);

    const document = await prisma.document.create({
      data: {
        name,
        type,
        content,
        metadata,
        sopId: sopId || undefined,
        uploadedById: currentUser.id,
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true,
            siteId: true,
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

    // Don't send the content in the response
    const { content: _, ...documentWithoutContent } = document;
    return NextResponse.json(documentWithoutContent);
  } catch (error) {
    console.error("Error creating document:", error);
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
      select: {
        id: true,
        role: true,
        siteId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const id = formData.get("id") as string;
    const file = formData.get("content") as File | null;
    // If there's a new file, use its name, otherwise keep existing name
    const name = file ? file.name : (formData.get("name") as string);
    const type = formData.get("type") as DocumentType;
    const metadataStr = formData.get("metadata") as string;
    const baseMetadata = JSON.parse(metadataStr);

    // If there's a new file, update the file-related metadata
    const metadata = file
      ? {
          ...baseMetadata,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
        }
      : baseMetadata;
    const sopId = formData.get("sopId") as string;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this document
    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        uploadedById: true,
        uploadedBy: {
          select: {
            siteId: true,
          },
        },
      },
    });

    if (
      !document ||
      (!["OWNER", "ADMIN"].includes(currentUser.role) &&
        document.uploadedBy.siteId !== currentUser.siteId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {
      name,
      type,
      metadata,
      sopId: sopId || undefined,
    };

    // Only update content and metadata if a new file is provided
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      updateData.content = Buffer.from(arrayBuffer);
      updateData.metadata = metadata;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true,
            siteId: true,
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

    // Don't send the content in the response
    const { content: _, ...documentWithoutContent } = updatedDocument;
    return NextResponse.json(documentWithoutContent);
  } catch (error) {
    console.error("Error updating document:", error);
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
      select: {
        id: true,
        role: true,
        siteId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this document
    const document = await prisma.document.findUnique({
      where: { id },
      select: {
        uploadedById: true,
        uploadedBy: {
          select: {
            siteId: true,
          },
        },
      },
    });

    if (
      !document ||
      (!["OWNER", "ADMIN"].includes(currentUser.role) &&
        document.uploadedBy.siteId !== currentUser.siteId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
