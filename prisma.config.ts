// Load dotenv only in development (when .env file exists)
// In production (Koyeb), environment variables are already in process.env
if (process.env.NODE_ENV !== "production" && typeof require !== "undefined") {
  try {
    require("dotenv/config");
  } catch {
    // dotenv not available - that's okay, env vars might be in process.env
  }
}

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  engine: "classic",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  // Explicitly set datasource URL from environment
  // This ensures DATABASE_URL is available during schema validation on Koyeb
  datasource: {
    url: env("DATABASE_URL"),
  },
});
