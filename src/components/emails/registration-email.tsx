import * as React from "react";
import { BaseEmail } from "./base-email";
import { siteConfig } from "@/lib/config";

interface RegistrationEmailProps {
  name: string;
  siteCode: string;
  siteName: string;
}

export const RegistrationEmail: React.FC<Readonly<RegistrationEmailProps>> = ({
  name,
  siteCode,
  siteName,
}) => (
  <BaseEmail title={`Welcome to ${siteConfig.name}`}>
    <div>
      <h2 style={{ color: "#2563eb", marginTop: 0 }}>Account Registration</h2>

      <p>Hello {name},</p>

      <p>
        Thank you for registering with {siteConfig.name}. Your account has been
        created and is currently <strong>pending approval</strong>.
      </p>

      <div className="highlight">
        <p style={{ margin: "0 0 8px 0" }}>
          <strong>Registration Details:</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          Site: <strong>{siteName}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          Site Code: <strong>{siteCode}</strong>
        </p>
      </div>

      <p>
        Once your account is approved, you will receive another email with login
        instructions. You will then be able to access all the training resources
        for your site.
      </p>

      <p>
        If you have any questions or did not request this registration, please
        contact your site administrator immediately.
      </p>

      <p style={{ marginTop: "30px", color: "#4b5563" }}>
        Best regards,
        <br />
        The {siteConfig.name} Team
      </p>
    </div>
  </BaseEmail>
);
