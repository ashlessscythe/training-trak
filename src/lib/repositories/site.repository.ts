import prisma from "@/lib/prisma";
import { Prisma, Site } from "@prisma/client";

export const SITE_INCLUDE_STATS = {
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
              status: "COMPLETED",
            },
          },
        },
      },
    },
  },
} satisfies Prisma.SiteInclude;

export type SiteWithStats = Prisma.SiteGetPayload<{
  include: typeof SITE_INCLUDE_STATS;
}>;

export interface SiteStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  totalSOPs: number;
  completedTrainings: number;
}

export class SiteRepository {
  /**
   * Calculate stats from site with relations
   */
  static calculateStats(site: SiteWithStats): SiteStats {
    return {
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
    };
  }

  /**
   * Transform site with stats
   */
  static transformWithStats(site: SiteWithStats) {
    return {
      ...site,
      stats: this.calculateStats(site),
      users: undefined,
    };
  }

  /**
   * Find site by ID
   */
  static async findById(id: string): Promise<Site | null> {
    return prisma.site.findUnique({
      where: { id },
    });
  }

  /**
   * Find site by ID with stats
   */
  static async findByIdWithStats(id: string) {
    const site = await prisma.site.findUnique({
      where: { id },
      include: SITE_INCLUDE_STATS,
    });

    if (!site) return null;

    return this.transformWithStats(site);
  }

  /**
   * Find site by code
   */
  static async findByCode(code: string): Promise<Site | null> {
    return prisma.site.findUnique({
      where: { code },
    });
  }

  /**
   * Find all sites
   */
  static async findAll(): Promise<Site[]> {
    return prisma.site.findMany({
      orderBy: { name: "asc" },
    });
  }

  /**
   * Find all sites with stats
   */
  static async findAllWithStats() {
    const sites = await prisma.site.findMany({
      include: SITE_INCLUDE_STATS,
      orderBy: { name: "asc" },
    });

    return sites.map((site) => this.transformWithStats(site));
  }

  /**
   * Find active sites
   */
  static async findActive(): Promise<Site[]> {
    return prisma.site.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Create a new site
   */
  static async create(data: {
    code: string;
    name: string;
    description?: string;
  }) {
    const site = await prisma.site.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: true,
      },
      include: SITE_INCLUDE_STATS,
    });

    return this.transformWithStats(site);
  }

  /**
   * Update a site
   */
  static async update(
    id: string,
    data: Partial<{
      code: string;
      name: string;
      description: string;
      isActive: boolean;
    }>
  ) {
    const updateData: any = { ...data };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const site = await prisma.site.update({
      where: { id },
      data: updateData,
      include: SITE_INCLUDE_STATS,
    });

    return this.transformWithStats(site);
  }

  /**
   * Deactivate a site (soft delete)
   */
  static async deactivate(id: string) {
    const site = await prisma.site.update({
      where: { id },
      data: { isActive: false },
      include: SITE_INCLUDE_STATS,
    });

    return this.transformWithStats(site);
  }

  /**
   * Delete a site (hard delete)
   */
  static async delete(id: string): Promise<Site> {
    return prisma.site.delete({
      where: { id },
    });
  }

  /**
   * Get site admins
   */
  static async getAdmins(siteId: string) {
    return prisma.siteAdmin.findMany({
      where: { siteId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Add site admin
   */
  static async addAdmin(siteId: string, userId: string) {
    return prisma.siteAdmin.create({
      data: {
        siteId,
        userId,
      },
    });
  }

  /**
   * Remove site admin
   */
  static async removeAdmin(siteId: string, userId: string) {
    return prisma.siteAdmin.delete({
      where: {
        userId_siteId: {
          userId,
          siteId,
        },
      },
    });
  }
}
