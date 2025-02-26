import * as React from "react";
import { siteConfig } from "@/lib/config";

interface BaseEmailProps {
  children: React.ReactNode;
  title: string;
}

export const BaseEmail: React.FC<Readonly<BaseEmailProps>> = ({
  children,
  title,
}) => (
  <html>
    {/* Use a div instead of head to avoid Next.js warnings */}
    <div className="email-head">
      {/* Title would normally be in head but for email templates it's fine in a div */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        {`
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f4f8;
            color: #1a202c;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 0;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            text-align: center;
            padding: 25px 20px;
            background: linear-gradient(135deg, #2563eb, #1e40af);
            color: white;
            margin-bottom: 0;
          }
          .header h1 {
            margin: 0;
            font-weight: 600;
            font-size: 24px;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 30px 25px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #64748b;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 20px;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          p {
            margin: 16px 0;
          }
          .highlight {
            background-color: #f0f9ff;
            border-left: 4px solid #2563eb;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 0 4px 4px 0;
          }
        `}
      </style>
    </div>
    <body>
      <div className="container">
        <div className="header">
          <h1>{title}</h1>
        </div>
        <div className="content">{children}</div>
        <div className="footer">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
  </html>
);
