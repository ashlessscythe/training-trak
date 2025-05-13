"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Site } from "@prisma/client";
import { useStackApp, SignUp } from "@stackframe/stack";
import Link from "next/link";

export default function CustomSignUp() {
  const router = useRouter();
  const stackApp = useStackApp();
  const [error, setError] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch available sites
    fetch("/api/sites")
      .then((res) => res.json())
      .then((data) => {
        setSites(data);
        if (data.length > 0) {
          setSelectedSiteId(data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load sites:", err));
  }, []);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;
    const siteId = selectedSiteId;

    try {
      // First, create the user with Stack Auth
      const result = await stackApp.signUpWithCredential({
        email,
        password,
      });

      if (result.status !== "ok") {
        throw new Error("Failed to sign up with provided credentials");
      }

      // Then, create the user in our database with additional info
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, siteId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create user record");
      }

      // Update the user's metadata with role and site
      await fetch("/api/auth/user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "PENDING", siteId }),
      });

      // Redirect to pending page
      router.push("/auth/pending");
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px] p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full p-2 border rounded"
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
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="site" className="block text-sm font-medium mb-1">
              Site
            </label>
            <select
              id="site"
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">
            Already have an account?{" "}
          </span>
          <Link
            href={`/handler/sign-in?after_auth_return_to=${encodeURIComponent(
              "/dashboard"
            )}`}
            className="text-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
