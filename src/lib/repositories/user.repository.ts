import prisma from "@/lib/prisma";
import { Prisma, User } from "@prisma/client";
import { hash } from "bcrypt";

export const USER_INCLUDE = {
  site: true,
  department: true,
  position: true,
  trainings: {
    select: {
      status: true,
    },
  },
  uploadedDocs: {
    select: {
      id: true,
    },
  },
  createdSOPs: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.UserInclude;

export const USER_SELECT_BASIC = {
  id: true,
  email: true,
  name: true,
  role: true,
  siteId: true,
  departmentId: true,
  positionId: true,
  shift: true,
  ssoId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof USER_INCLUDE;
}>;

export class UserRepository {
  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by email with site
   */
  static async findByEmailWithSite(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { site: true },
    });
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by ID with relations
   */
  static async findByIdWithRelations(id: string): Promise<UserWithRelations | null> {
    return prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });
  }

  /**
   * Find all users with relations
   */
  static async findAll(): Promise<UserWithRelations[]> {
    return prisma.user.findMany({
      include: USER_INCLUDE,
      orderBy: [
        { site: { name: "asc" } },
        { role: "asc" },
        { name: "asc" },
      ],
    });
  }

  /**
   * Find users by site ID
   */
  static async findBySiteId(siteId: string): Promise<UserWithRelations[]> {
    return prisma.user.findMany({
      where: { siteId },
      include: USER_INCLUDE,
      orderBy: [
        { role: "asc" },
        { name: "asc" },
      ],
    });
  }

  /**
   * Find users by department ID
   */
  static async findByDepartmentId(departmentId: string): Promise<UserWithRelations[]> {
    return prisma.user.findMany({
      where: { departmentId },
      include: USER_INCLUDE,
      orderBy: { name: "asc" },
    });
  }

  /**
   * Find pending users
   */
  static async findPending(): Promise<UserWithRelations[]> {
    return prisma.user.findMany({
      where: { role: "PENDING" },
      include: USER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a new user
   */
  static async create(data: {
    email: string;
    name: string;
    password: string;
    role: string;
    siteId: string;
    departmentId: string;
    positionId: string;
    shift?: string;
    ssoId?: string;
  }): Promise<User> {
    const hashedPassword = await hash(data.password, 10);

    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role as any,
        siteId: data.siteId,
        departmentId: data.departmentId,
        positionId: data.positionId,
        shift: data.shift as any,
        ssoId: data.ssoId,
        isActive: true,
      },
    });
  }

  /**
   * Update a user
   */
  static async update(
    id: string,
    data: Partial<{
      email: string;
      name: string;
      password: string;
      role: string;
      siteId: string;
      departmentId: string;
      positionId: string;
      shift: string;
      ssoId: string;
      isActive: boolean;
      resetToken: string | null;
      resetTokenExpires: Date | null;
    }>
  ): Promise<UserWithRelations> {
    const updateData: any = { ...data };

    // Hash password if provided
    if (data.password) {
      updateData.password = await hash(data.password, 10);
    }

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    return prisma.user.update({
      where: { id },
      data: updateData,
      include: USER_INCLUDE,
    });
  }

  /**
   * Deactivate a user (soft delete)
   */
  static async deactivate(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Delete a user (hard delete)
   */
  static async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Count users by site
   */
  static async countBySite(siteId: string): Promise<number> {
    return prisma.user.count({
      where: { siteId },
    });
  }

  /**
   * Count active users by site
   */
  static async countActiveBySite(siteId: string): Promise<number> {
    return prisma.user.count({
      where: { siteId, isActive: true },
    });
  }

  /**
   * Find user by reset token
   */
  static async findByResetToken(token: string) {
    return prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Set password reset token
   */
  static async setResetToken(
    email: string,
    token: string,
    expiresAt: Date
  ): Promise<User> {
    return prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpires: expiresAt,
      },
    });
  }

  /**
   * Clear password reset token
   */
  static async clearResetToken(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        resetToken: null,
        resetTokenExpires: null,
      },
    });
  }
}
