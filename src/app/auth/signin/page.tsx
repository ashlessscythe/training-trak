"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useStackApp } from "@stackframe/stack";

export default function CustomSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("redirect") || "/dashboard";
  const stackApp = useStackApp();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await stackApp.signInWithCredential({
        email,
        password,
      });

      if (result.status !== "ok") {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Get the user's metadata to check their role
      const user = await stackApp.getUser();

      if (user?.clientMetadata?.role === "PENDING") {
        router.push("/auth/pending");
      } else {
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-[350px] p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center">Sign In</h2>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Enter your credentials to access your account
          </p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full p-2 rounded-md border bg-background"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full p-2 rounded-md border bg-background"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <div className="mb-2">
            <Link
              href="/auth/forgot-password"
              className="text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <span className="text-muted-foreground">
            Don&apos;t have an account?{" "}
          </span>
          <Link
            href={`/handler/sign-up?after_auth_return_to=${encodeURIComponent(
              "/dashboard"
            )}`}
            className="text-primary hover:underline"
          >
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
