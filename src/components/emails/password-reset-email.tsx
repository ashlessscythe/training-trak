import * as React from "react";
import { BaseEmail } from "./base-email";
import { siteConfig } from "@/lib/config";

interface PasswordResetEmailProps {
  name: string;
  resetLink: string;
}

export const PasswordResetEmail: React.FC<
  Readonly<PasswordResetEmailProps>
> = ({ name, resetLink }) => (
  <BaseEmail title={`${siteConfig.name} - Password Reset`}>
    <p>Hello {name},</p>
    <p>
      We received a request to reset your password for your {siteConfig.name}{" "}
      account. If you didn&apos;t make this request, you can safely ignore this
      email.
    </p>
    <p>
      To reset your password, click the button below. This link will expire in 1
      hour.
    </p>
    <div style={{ textAlign: "center", margin: "30px 0" }}>
      <a href={resetLink} className="button">
        Reset Password
      </a>
    </div>
    <p>
      If the button above doesn&apos;t work, you can also copy and paste the
      following link into your browser:
    </p>
    <div className="highlight">
      <p style={{ wordBreak: "break-all", margin: "0" }}>{resetLink}</p>
    </div>
    <p>
      For security reasons, this password reset link will expire in 1 hour. If
      you need to reset your password after that time, please submit a new
      request.
    </p>
    <p>Thank you,</p>
    <p>The {siteConfig.name} Team</p>
  </BaseEmail>
);
