import * as React from "react";
import { BaseEmail } from "./base-email";
import { siteConfig } from "@/lib/config";

interface AccountApprovalEmailProps {
  name: string;
  siteName: string;
  role: string;
  loginUrl: string;
}

export const AccountApprovalEmail: React.FC<
  Readonly<AccountApprovalEmailProps>
> = ({ name, siteName, role, loginUrl }) => (
  <BaseEmail title={`${siteConfig.name} - Account Approved`}>
    <div>
      <h2 style={{ color: "#2563eb", marginTop: 0 }}>Account Approved</h2>

      <p>Hello {name},</p>

      <p>
        Great news! Your {siteConfig.name} account for{" "}
        <strong>{siteName}</strong> has been approved and is now active.
      </p>

      <div className="highlight">
        <p style={{ margin: "0 0 8px 0" }}>
          <strong>Account Details:</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          Site: <strong>{siteName}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          Role: <strong>{role}</strong>
        </p>
      </div>

      <p>
        You can now log in to access your training resources and track your
        progress. Our platform provides you with all the tools you need to
        complete your required training efficiently.
      </p>

      <div style={{ textAlign: "center", margin: "35px 0" }}>
        <a href={loginUrl} className="button">
          Log In Now
        </a>
      </div>

      <p>
        If you have any questions about your account or training requirements,
        please contact your site administrator.
      </p>

      <p style={{ marginTop: "30px", color: "#4b5563" }}>
        Best regards,
        <br />
        The {siteConfig.name} Team
      </p>
    </div>
  </BaseEmail>
);
