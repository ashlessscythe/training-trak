"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold hover:opacity-80">
          <span className="gradient-text">{siteConfig.name.split(" ")[0]}</span>{" "}
          {siteConfig.name.split(" ")[1]}
        </Link>
        <nav className="hidden md:flex items-center space-x-1 flex-1 justify-end">
          {session ? (
            <>
              <Button variant="link" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link href="/trainings">Trainings</Link>
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {session.user?.name}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="link" size="sm" asChild>
                <Link href="#features">Features</Link>
              </Button>
              <Button variant="link" size="sm" asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </>
          )}
        </nav>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 px-4 space-y-2">
            {session ? (
              <>
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className="w-full text-right"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className="w-full text-right"
                >
                  <Link href="/trainings">Trainings</Link>
                </Button>
                <div className="text-sm text-muted-foreground px-2 py-1 text-right">
                  {session.user?.name}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="w-full text-right"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className="w-full text-right"
                >
                  <Link href="#features">Features</Link>
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className="w-full text-right"
                >
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="w-full text-right"
                >
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
