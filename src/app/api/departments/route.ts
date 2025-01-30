import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Failed to fetch deptartments", error)
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 },
    )  
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const department = await prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: true,
      },
    });
    return NextResponse.json(department);
  } catch (error) {
    console.error("Failed to create department:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const department = await prisma.department.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return NextResponse.json(department);
  } catch (error) {
    console.error("Failed to update department:", error);
    return NextResponse.json(
      { error: "Failed to update department" },
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
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json(department);
  } catch (error) {
    console.error("Failed to delete department:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
