"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useStackApp } from "@stackframe/stack";

export default function PendingPage() {
  const user = useUser();
  const stackApp = useStackApp();
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      redirect("/handler/sign-in");
    }

    // Check if user is an OAuth user
    if (user?.oauthProviders && user.oauthProviders.length > 0) {
      setIsOAuthUser(true);
      setOauthProvider(user.oauthProviders[0].id);
    }

    // Check if user has clientReadOnlyMetadata.registrationType
    if (user?.clientReadOnlyMetadata?.registrationType === "OAUTH") {
      setIsOAuthUser(true);
      setOauthProvider(user.clientReadOnlyMetadata.oauthProvider || null);
    }
  }, [user]);

  const handleSignOut = () => {
    // Redirect to the sign-out handler
    window.location.href = "/handler/sign-out";
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">
            Account Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOAuthUser ? (
            <>
              <p className="text-center text-muted-foreground">
                Thank you for signing in with {oauthProvider || "OAuth"}.
              </p>
              <p className="text-center text-muted-foreground">
                Your account is currently pending approval from an
                administrator.
              </p>
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              Your account is currently pending approval from an administrator.
            </p>
          )}
          <p className="text-center text-muted-foreground">
            You will receive an email notification once your account has been
            reviewed.
          </p>
          <p className="text-center text-muted-foreground">
            Thank you for your patience.
          </p>
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
