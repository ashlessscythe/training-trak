import { SiteRepository } from "@/lib/repositories";
import { ApiError } from "@/lib/api/auth";
import { HTTP_STATUS, ERROR_MESSAGES } from "@/lib/constants";
import { CreateSiteInput, UpdateSiteInput } from "@/lib/validations";

export class SiteService {
  /**
   * Get all sites
   */
  static async getAllSites() {
    return SiteRepository.findAll();
  }

  /**
   * Get all sites with stats
   */
  static async getAllSitesWithStats() {
    return SiteRepository.findAllWithStats();
  }

  /**
   * Get site by ID
   */
  static async getSiteById(id: string) {
    const site = await SiteRepository.findById(id);
    
    if (!site) {
      throw new ApiError(ERROR_MESSAGES.SITE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return site;
  }

  /**
   * Get site by ID with stats
   */
  static async getSiteByIdWithStats(id: string) {
    const site = await SiteRepository.findByIdWithStats(id);
    
    if (!site) {
      throw new ApiError(ERROR_MESSAGES.SITE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return site;
  }

  /**
   * Get active sites
   */
  static async getActiveSites() {
    return SiteRepository.findActive();
  }

  /**
   * Create a new site
   */
  static async createSite(data: CreateSiteInput) {
    // Check if code already exists
    const existingSite = await SiteRepository.findByCode(data.code);
    if (existingSite) {
      throw new ApiError(ERROR_MESSAGES.CODE_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }

    return SiteRepository.create(data);
  }

  /**
   * Update a site
   */
  static async updateSite(data: UpdateSiteInput) {
    const { id, ...updateData } = data;

    // Check if site exists
    const existingSite = await SiteRepository.findById(id);
    if (!existingSite) {
      throw new ApiError(ERROR_MESSAGES.SITE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if code is being changed and if it's already taken
    if (updateData.code && updateData.code !== existingSite.code) {
      const codeTaken = await SiteRepository.findByCode(updateData.code);
      if (codeTaken) {
        throw new ApiError(ERROR_MESSAGES.CODE_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
      }
    }

    return SiteRepository.update(id, updateData);
  }

  /**
   * Deactivate a site
   */
  static async deactivateSite(id: string) {
    const site = await SiteRepository.findById(id);
    if (!site) {
      throw new ApiError(ERROR_MESSAGES.SITE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return SiteRepository.deactivate(id);
  }

  /**
   * Delete a site
   */
  static async deleteSite(id: string) {
    const site = await SiteRepository.findById(id);
    if (!site) {
      throw new ApiError(ERROR_MESSAGES.SITE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return SiteRepository.delete(id);
  }

  /**
   * Get site admins
   */
  static async getSiteAdmins(siteId: string) {
    const site = await SiteRepository.findById(siteId);
    if (!site) {
      throw new ApiError(ERROR_MESSAGES.SITE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return SiteRepository.getAdmins(siteId);
  }

  /**
   * Add site admin
   */
  static async addSiteAdmin(siteId: string, userId: string) {
    const site = await SiteRepository.findById(siteId);
    if (!site) {
      throw new ApiError(ERROR_MESSAGES.SITE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return SiteRepository.addAdmin(siteId, userId);
  }

  /**
   * Remove site admin
   */
  static async removeSiteAdmin(siteId: string, userId: string) {
    const site = await SiteRepository.findById(siteId);
    if (!site) {
      throw new ApiError(ERROR_MESSAGES.SITE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return SiteRepository.removeAdmin(siteId, userId);
  }
}
