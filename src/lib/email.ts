import { Resend } from "resend";
import { RegistrationEmail } from "@/components/emails/registration-email";
import { AccountApprovalEmail } from "@/components/emails/account-approval-email";
import { AdminNotificationEmail } from "@/components/emails/admin-notification-email";
import { User, Site } from "@prisma/client";
import * as React from "react";
import { siteConfig } from "./config";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail =
  process.env.SMTP_FROM || `${siteConfig.name}<noreply@example.com>`;

// Email types
export type EmailType = "registration" | "account-approval";

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
   * Send a notification email to admins and site admins about a new user registration
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
}
