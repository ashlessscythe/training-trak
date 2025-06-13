import { Site, Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
      site: Site;
      adminSites?: Site[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    site: Site;
    adminSites?: Site[];
  }
} 