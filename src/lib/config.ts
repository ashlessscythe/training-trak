export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Training Trak",
  description: "Corporate training management and compliance tracking system",
  url: process.env.NEXTAUTH_URL || "http://localhost:3000",
} as const;
