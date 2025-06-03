"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { themes } from "@/lib/themes";

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <NextThemesProvider
      {...props}
      themes={themes.map(t => t.name)}
      attribute="class"
      value={{
        light: "light",
        dark: "dark",
        skeleton: "skeleton",
        modern: "modern",
        retro: "retro",
      }}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
