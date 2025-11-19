import { Resend } from "resend";
import { RegistrationEmail } from "@/components/emails/registration-email";
import { AccountApprovalEmail } from "@/components/emails/account-approval-email";
import { AdminNotificationEmail } from "@/components/emails/admin-notification-email";
import { PasswordResetEmail } from "@/components/emails/password-reset-email";
import { User, Site } from "@prisma/client";
import * as React from "react";
import { siteConfig } from "./config";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail =
  process.env.SMTP_FROM || `${siteConfig.name}<noreply@example.com>`;

// Email types
export type EmailType =
  | "registration"
  | "account-approval"
  | "password-reset"
  | "admin-notification";

// Email service
export class EmailService {
  /**
   * Send an email
   * @param to Recipient email address
   * @param subject Email subject
   * @param react React component to render as email content
   * @returns Promise with the result of the email sending operation
   */
  private static async sendEmail(
    to: string | string[],
    subject: string,
    react: JSX.Element,
    bcc?: string[]
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        react,
        bcc: bcc,
      });

      if (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Exception sending email:", error);
      return { success: false, error };
    }
  }

  /**
   * Send a registration email to a new user
   * @param user User object
   * @param site Site object
   * @returns Promise with the result of the email sending operation
   */
  static async sendRegistrationEmail(user: User, site: Site) {
    return this.sendEmail(
      user.email,
      `Welcome to ${siteConfig.name}`,
      React.createElement(RegistrationEmail, {
        name: user.name,
        siteCode: site.code,
        siteName: site.name,
      })
    );
  }

  /**
   * Send an account approval email to a user
   * @param user User object
   * @param site Site object
   * @returns Promise with the result of the email sending operation
   */
  static async sendAccountApprovalEmail(user: User, site: Site) {
    const loginUrl = `${process.env.NEXTAUTH_URL}/auth/signin`;

    return this.sendEmail(
      user.email,
      `${siteConfig.name} - Account Approved`,
      React.createElement(AccountApprovalEmail, {
        name: user.name,
        siteName: site.name,
        role: user.role,
        loginUrl,
      })
    );
  }

  /**
   * Send an admin notification email to admins and site admins about a new user registration
   * @param user Newly registered user object
   * @param site Site object
   * @param adminEmails Array of admin email addresses
   * @returns Promise with the result of the email sending operation
   */
  static async sendAdminNotificationEmail(
    user: User,
    site: Site,
    adminEmails: string[]
  ) {
    if (adminEmails.length === 0) {
      console.log("No admin emails provided for notification");
      return { success: false, error: "No admin emails provided" };
    }

    const adminDashboardUrl = `${process.env.NEXTAUTH_URL}/admin/users`;

    // Send to the first admin with others in BCC
    const primaryRecipient = adminEmails[0];
    const bccRecipients = adminEmails.length > 1 ? adminEmails.slice(1) : [];

    return this.sendEmail(
      primaryRecipient,
      `${siteConfig.name} - New User Registration`,
      React.createElement(AdminNotificationEmail, {
        userName: user.name,
        userEmail: user.email,
        siteName: site.name,
        siteCode: site.code,
        adminDashboardUrl,
      }),
      bccRecipients
    );
  }

  /**
   * Send a password reset email to a user
   * @param user User object
   * @param resetToken Password reset token
   * @returns Promise with the result of the email sending operation
   */
  static async sendPasswordResetEmail(user: User, resetToken: string) {
    const resetLink = `${
      process.env.NEXTAUTH_URL
    }/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(
      user.email
    )}`;

    return this.sendEmail(
      user.email,
      `${siteConfig.name} - Password Reset`,
      React.createElement(PasswordResetEmail, {
        name: user.name,
        resetLink,
      })
    );
  }

  /**
   * Send a test email with custom parameters
   * @param type Email type
   * @param to Recipient email address
   * @param params Custom parameters for the email template
   * @returns Promise with the result of the email sending operation
   */
  static async sendTestEmail(
    type: EmailType,
    to: string,
    params: {
      // Registration email params
      name?: string;
      siteCode?: string;
      siteName?: string;
      // Account approval email params
      role?: string;
      loginUrl?: string;
      // Password reset email params
      resetLink?: string;
      // Admin notification email params
      userName?: string;
      userEmail?: string;
      adminDashboardUrl?: string;
    }
  ) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    switch (type) {
      case "registration":
        return this.sendEmail(
          to,
          `[TEST] Welcome to ${siteConfig.name}`,
          React.createElement(RegistrationEmail, {
            name: params.name || "Test User",
            siteCode: params.siteCode || "TEST",
            siteName: params.siteName || "Test Site",
          })
        );

      case "account-approval":
        return this.sendEmail(
          to,
          `[TEST] ${siteConfig.name} - Account Approved`,
          React.createElement(AccountApprovalEmail, {
            name: params.name || "Test User",
            siteName: params.siteName || "Test Site",
            role: params.role || "USER",
            loginUrl: params.loginUrl || `${baseUrl}/auth/signin`,
          })
        );

      case "password-reset":
        return this.sendEmail(
          to,
          `[TEST] ${siteConfig.name} - Password Reset`,
          React.createElement(PasswordResetEmail, {
            name: params.name || "Test User",
            resetLink:
              params.resetLink ||
              `${baseUrl}/auth/reset-password?token=test-token&email=${encodeURIComponent(to)}`,
          })
        );

      case "admin-notification":
        return this.sendEmail(
          to,
          `[TEST] New User Registration - ${siteConfig.name}`,
          React.createElement(AdminNotificationEmail, {
            userName: params.userName || "Test User",
            userEmail: params.userEmail || "test@example.com",
            siteName: params.siteName || "Test Site",
            siteCode: params.siteCode || "TEST",
            adminDashboardUrl:
              params.adminDashboardUrl || `${baseUrl}/admin/users`,
          })
        );

      default:
        return { success: false, error: "Invalid email type" };
    }
  }
}
