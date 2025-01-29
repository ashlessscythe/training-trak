import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const positions = await prisma.position.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(positions);
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const position = await prisma.position.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: true,
      },
    });
    return NextResponse.json(position);
  } catch (error) {
    console.error("Failed to create position:", error);
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const position = await prisma.position.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return NextResponse.json(position);
  } catch (error) {
    console.error("Failed to update position:", error);
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Position ID is required" },
        { status: 400 }
      );
    }

    const position = await prisma.position.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json(position);
  } catch (error) {
    console.error("Failed to delete position:", error);
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 }
    );
  }
}
