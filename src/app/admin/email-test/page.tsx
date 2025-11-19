"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Mail, Loader2 } from "lucide-react";
import { API_ROUTES } from "@/lib/constants";

type EmailType = "registration" | "account-approval" | "password-reset" | "admin-notification";

interface EmailParams {
  // Common
  name?: string;
  // Registration & Admin Notification
  siteCode?: string;
  siteName?: string;
  // Account Approval
  role?: string;
  loginUrl?: string;
  // Password Reset
  resetLink?: string;
  // Admin Notification
  userName?: string;
  userEmail?: string;
  adminDashboardUrl?: string;
}

interface RequiredFields {
  [key: string]: string[];
}

const REQUIRED_FIELDS: RequiredFields = {
  registration: ["name", "siteCode", "siteName"],
  "account-approval": ["name", "siteName", "role", "loginUrl"],
  "password-reset": ["name", "resetLink"],
  "admin-notification": ["userName", "userEmail", "siteName", "siteCode", "adminDashboardUrl"],
};

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  registration: "Registration Email",
  "account-approval": "Account Approval Email",
  "password-reset": "Password Reset Email",
  "admin-notification": "Admin Notification Email",
};

export default function EmailTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;

  const [emailType, setEmailType] = useState<EmailType | "">("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [params, setParams] = useState<EmailParams>({});
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status === "authenticated" && !["OWNER", "ADMIN"].includes(userRole as string)) {
      router.push("/dashboard");
    }
  }, [status, userRole, router]);

  if (status === "loading") {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session || !["OWNER", "ADMIN"].includes(userRole as string)) {
    return null;
  }

  const getMissingFields = (): string[] => {
    if (!emailType) return [];
    const required = REQUIRED_FIELDS[emailType] || [];
    return required.filter((field) => {
      const value = params[field as keyof EmailParams];
      return !value || value.trim() === "";
    });
  };

  const handleSend = () => {
    if (!emailType || !recipientEmail) {
      setErrorMessage("Please select an email type and enter a recipient email.");
      return;
    }

    const missing = getMissingFields();
    if (missing.length > 0) {
      setMissingFields(missing);
      setIsWarningModalOpen(true);
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmSend = async () => {
    setIsConfirmModalOpen(false);
    setIsSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(API_ROUTES.EMAIL.BASE + "/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: emailType,
          to: recipientEmail,
          params,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSuccessMessage(`Test email sent successfully! Email ID: ${data.emailId || "N/A"}`);
      // Reset form
      setEmailType("");
      setRecipientEmail("");
      setParams({});
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred while sending the email");
    } finally {
      setIsSending(false);
    }
  };

  const updateParam = (key: keyof EmailParams, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const renderFields = () => {
    if (!emailType) return null;

    const fields: JSX.Element[] = [];

    // Common fields
    if (emailType === "registration" || emailType === "account-approval" || emailType === "password-reset") {
      fields.push(
        <div key="name" className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            value={params.name || ""}
            onChange={(e) => updateParam("name", e.target.value)}
            placeholder="John Doe"
          />
        </div>
      );
    }

    // Registration email fields
    if (emailType === "registration") {
      fields.push(
        <div key="siteCode" className="space-y-2">
          <label htmlFor="siteCode" className="text-sm font-medium">
            Site Code <span className="text-destructive">*</span>
          </label>
          <Input
            id="siteCode"
            value={params.siteCode || ""}
            onChange={(e) => updateParam("siteCode", e.target.value)}
            placeholder="NYC-001"
          />
        </div>
      );
      fields.push(
        <div key="siteName" className="space-y-2">
          <label htmlFor="siteName" className="text-sm font-medium">
            Site Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="siteName"
            value={params.siteName || ""}
            onChange={(e) => updateParam("siteName", e.target.value)}
            placeholder="New York Office"
          />
        </div>
      );
    }

    // Account approval email fields
    if (emailType === "account-approval") {
      fields.push(
        <div key="siteName" className="space-y-2">
          <label htmlFor="siteName" className="text-sm font-medium">
            Site Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="siteName"
            value={params.siteName || ""}
            onChange={(e) => updateParam("siteName", e.target.value)}
            placeholder="New York Office"
          />
        </div>
      );
      fields.push(
        <div key="role" className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium">
            Role <span className="text-destructive">*</span>
          </label>
          <Input
            id="role"
            value={params.role || ""}
            onChange={(e) => updateParam("role", e.target.value)}
            placeholder="USER"
          />
        </div>
      );
      fields.push(
        <div key="loginUrl" className="space-y-2">
          <label htmlFor="loginUrl" className="text-sm font-medium">
            Login URL <span className="text-destructive">*</span>
          </label>
          <Input
            id="loginUrl"
            value={params.loginUrl || ""}
            onChange={(e) => updateParam("loginUrl", e.target.value)}
            placeholder="https://example.com/auth/signin"
          />
        </div>
      );
    }

    // Password reset email fields
    if (emailType === "password-reset") {
      fields.push(
        <div key="resetLink" className="space-y-2">
          <label htmlFor="resetLink" className="text-sm font-medium">
            Reset Link <span className="text-destructive">*</span>
          </label>
          <Input
            id="resetLink"
            value={params.resetLink || ""}
            onChange={(e) => updateParam("resetLink", e.target.value)}
            placeholder="https://example.com/auth/reset-password?token=xxx"
          />
        </div>
      );
    }

    // Admin notification email fields
    if (emailType === "admin-notification") {
      fields.push(
        <div key="userName" className="space-y-2">
          <label htmlFor="userName" className="text-sm font-medium">
            User Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="userName"
            value={params.userName || ""}
            onChange={(e) => updateParam("userName", e.target.value)}
            placeholder="John Doe"
          />
        </div>
      );
      fields.push(
        <div key="userEmail" className="space-y-2">
          <label htmlFor="userEmail" className="text-sm font-medium">
            User Email <span className="text-destructive">*</span>
          </label>
          <Input
            id="userEmail"
            type="email"
            value={params.userEmail || ""}
            onChange={(e) => updateParam("userEmail", e.target.value)}
            placeholder="user@example.com"
          />
        </div>
      );
      fields.push(
        <div key="siteName" className="space-y-2">
          <label htmlFor="siteName" className="text-sm font-medium">
            Site Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="siteName"
            value={params.siteName || ""}
            onChange={(e) => updateParam("siteName", e.target.value)}
            placeholder="New York Office"
          />
        </div>
      );
      fields.push(
        <div key="siteCode" className="space-y-2">
          <label htmlFor="siteCode" className="text-sm font-medium">
            Site Code <span className="text-destructive">*</span>
          </label>
          <Input
            id="siteCode"
            value={params.siteCode || ""}
            onChange={(e) => updateParam("siteCode", e.target.value)}
            placeholder="NYC-001"
          />
        </div>
      );
      fields.push(
        <div key="adminDashboardUrl" className="space-y-2">
          <label htmlFor="adminDashboardUrl" className="text-sm font-medium">
            Admin Dashboard URL <span className="text-destructive">*</span>
          </label>
          <Input
            id="adminDashboardUrl"
            value={params.adminDashboardUrl || ""}
            onChange={(e) => updateParam("adminDashboardUrl", e.target.value)}
            placeholder="https://example.com/admin/users"
          />
        </div>
      );
    }

    return fields;
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Email Test Center</h1>
        <p className="text-muted-foreground">
          Test email templates by sending emails with custom parameters
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Test Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Type Selection */}
          <div className="space-y-2">
            <label htmlFor="emailType" className="text-sm font-medium">
              Email Template Type <span className="text-destructive">*</span>
            </label>
            <Select
              value={emailType}
              onValueChange={(value) => {
                setEmailType(value as EmailType);
                setParams({});
              }}
            >
              <SelectTrigger id="emailType">
                <SelectValue placeholder="Select an email template" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMAIL_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <label htmlFor="recipientEmail" className="text-sm font-medium">
              Recipient Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          {/* Dynamic Fields Based on Email Type */}
          {emailType && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Template Parameters</h3>
              <div className="space-y-4">{renderFields()}</div>
            </div>
          )}

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
              {errorMessage}
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={isSending || !emailType || !recipientEmail}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Warning Modal for Missing Fields */}
      <Dialog open={isWarningModalOpen} onOpenChange={setIsWarningModalOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <DialogTitle>Missing Required Fields</DialogTitle>
            </div>
            <DialogDescription className="pt-4">
              <p className="mb-4">
                The following required fields are missing or empty:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                {missingFields.map((field) => (
                  <li key={field} className="font-medium">
                    {field}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                Please fill in all required fields before sending the test email.
                You can still send the email, but it will use placeholder values
                for missing fields.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWarningModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              setIsWarningModalOpen(false);
              setIsConfirmModalOpen(true);
            }}>
              Send Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send Test Email</DialogTitle>
            <DialogDescription className="pt-4">
              <p className="mb-2">
                Are you sure you want to send a test email?
              </p>
              <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                <p>
                  <strong>Type:</strong> {EMAIL_TYPE_LABELS[emailType as EmailType]}
                </p>
                <p>
                  <strong>To:</strong> {recipientEmail}
                </p>
              </div>
              {missingFields.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    ⚠️ Missing fields will use placeholder values
                  </p>
                  <ul className="text-xs text-amber-700 list-disc list-inside">
                    {missingFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSend}>
              Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

