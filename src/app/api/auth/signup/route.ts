import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Get default site
    const defaultSite = await prisma.site.findFirst({
      where: { code: "DEFAULT" },
    });

    if (!defaultSite) {
      return NextResponse.json(
        { error: "Default site not found" },
        { status: 500 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with PENDING role
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        siteId: defaultSite.id,
        role: "PENDING",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        site: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
