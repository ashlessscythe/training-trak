"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Site } from "@prisma/client";

declare global {
  interface Window {
    turnstile: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function SignUp() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Fetch available sites
    fetch("/api/sites")
      .then((res) => res.json())
      .then((data) => setSites(data))
      .catch((err) => console.error("Failed to load sites:", err));
  }, []);

  useEffect(() => {
    // Load Turnstile script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Render Turnstile widget after script loads
      if (turnstileRef.current && window.turnstile) {
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
        if (siteKey) {
          widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              setTurnstileToken(token);
            },
            "error-callback": () => {
              setTurnstileToken("");
              setError("Turnstile verification failed. Please try again.");
            },
            "expired-callback": () => {
              setTurnstileToken("");
              if (widgetIdRef.current && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current);
              }
            },
          });
        } else {
          console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured");
          setError(
            "Security verification is not properly configured. Please contact support."
          );
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script and widget
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      const existingScript = document.querySelector(
        'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Check if Turnstile token is present
    if (!turnstileToken) {
      setError("Please complete the security verification.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
      siteId: formData.get("siteId"),
      turnstileToken,
    };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to sign up");
      }

      router.push("/auth/signin");
    } catch (err: any) {
      setError(err.message);
      // Reset Turnstile widget on error
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[350px] p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
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
            <div ref={turnstileRef} className="flex justify-center"></div>
          </div>
          <Button type="submit" className="w-full" disabled={!turnstileToken}>
            Sign Up
          </Button>
        </form>
      </Card>
    </div>
  );
}
