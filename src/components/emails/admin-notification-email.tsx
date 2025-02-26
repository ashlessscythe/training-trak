import * as React from "react";
import { BaseEmail } from "./base-email";
import { siteConfig } from "@/lib/config";

interface AdminNotificationEmailProps {
  userName: string;
  userEmail: string;
  siteName: string;
  siteCode: string;
  adminDashboardUrl: string;
}

export const AdminNotificationEmail: React.FC<
  Readonly<AdminNotificationEmailProps>
> = ({ userName, userEmail, siteName, siteCode, adminDashboardUrl }) => (
  <BaseEmail title={`New User Registration - ${siteConfig.name}`}>
    <div>
      <h2 style={{ color: "#2563eb", marginTop: 0 }}>New User Registration</h2>

      <p>Hello Admin,</p>

      <p>
        A new user has registered on {siteConfig.name} and is pending approval.
      </p>

      <div className="highlight">
        <p style={{ margin: "0 0 8px 0" }}>
          <strong>User Details:</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          Name: <strong>{userName}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          Email: <strong>{userEmail}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          Site: <strong>{siteName}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          Site Code: <strong>{siteCode}</strong>
        </p>
      </div>

      <p>
        Please review this registration and approve or reject it as appropriate.
      </p>

      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <a href={adminDashboardUrl} className="button">
          Review User
        </a>
      </div>

      <p style={{ marginTop: "30px", color: "#4b5563" }}>
        Best regards,
        <br />
        The {siteConfig.name} Team
      </p>
    </div>
  </BaseEmail>
);
