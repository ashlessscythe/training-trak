"use client";

// This file is kept for compatibility but no longer used
// Stack Auth is now used for authentication instead of NextAuth

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
