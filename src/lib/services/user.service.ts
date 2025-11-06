import { UserRepository } from "@/lib/repositories";
import { EmailService } from "@/lib/email";
import { ApiError } from "@/lib/api/auth";
import { HTTP_STATUS, ERROR_MESSAGES } from "@/lib/constants";
import { CreateUserInput, UpdateUserInput } from "@/lib/validations";

export class UserService {
  /**
   * Get all users
   */
  static async getAllUsers() {
    return UserRepository.findAll();
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string) {
    const user = await UserRepository.findByIdWithRelations(id);
    
    if (!user) {
      throw new ApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }

  /**
   * Get users by site
   */
  static async getUsersBySite(siteId: string) {
    return UserRepository.findBySiteId(siteId);
  }

  /**
   * Get pending users
   */
  static async getPendingUsers() {
    return UserRepository.findPending();
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserInput) {
    // Check if email already exists
    const existingUser = await UserRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ApiError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }

    return UserRepository.create(data);
  }

  /**
   * Update a user
   */
  static async updateUser(data: UpdateUserInput) {
    const { id, ...updateData } = data;

    // Check if user exists
    const existingUser = await UserRepository.findById(id);
    if (!existingUser) {
      throw new ApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailTaken = await UserRepository.findByEmail(updateData.email);
      if (emailTaken) {
        throw new ApiError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
      }
    }

    // Check if role is changing from PENDING
    const wasRoleChanged =
      existingUser.role === "PENDING" && updateData.role && updateData.role !== "PENDING";

    const updatedUser = await UserRepository.update(id, updateData);

    // Send approval email if role changed from PENDING
    if (wasRoleChanged) {
      try {
        await EmailService.sendAccountApprovalEmail(updatedUser, updatedUser.site);
        console.log(`Account approval email sent to ${updatedUser.email}`);
      } catch (emailError) {
        console.error("Failed to send account approval email:", emailError);
        // Continue even if email fails
      }
    }

    return updatedUser;
  }

  /**
   * Deactivate a user
   */
  static async deactivateUser(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new ApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return UserRepository.deactivate(id);
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new ApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return UserRepository.delete(id);
  }

  /**
   * Approve a user (change role from PENDING)
   */
  static async approveUser(id: string, role: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new ApiError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (user.role !== "PENDING") {
      throw new ApiError("User is already approved", HTTP_STATUS.BAD_REQUEST);
    }

    return this.updateUser({ id, role: role as any });
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }

    // Generate reset token
    const token = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await UserRepository.setResetToken(email, token, expiresAt);

    // Send reset email
    try {
      await EmailService.sendPasswordResetEmail(user, token);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      throw new ApiError("Failed to send reset email", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return { success: true };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string) {
    const user = await UserRepository.findByResetToken(token);
    if (!user) {
      throw new ApiError("Invalid or expired reset token", HTTP_STATUS.BAD_REQUEST);
    }

    await UserRepository.update(user.id, { password: newPassword });
    await UserRepository.clearResetToken(user.id);

    return { success: true };
  }
}
