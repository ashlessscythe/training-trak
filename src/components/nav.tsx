import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Role, Site } from "@prisma/client";

interface NavigationItem {
  name: string;
  href: string;
  roles: Role[];
  siteHref?: (siteId: string) => string;
  siteRoles?: Role[];
}

interface SessionUser {
  id: string;
  role: Role;
  site: Site;
  adminSites?: Site[];
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const baseNavigation: NavigationItem[] = [
  // Common for all logged-in users
  {
    name: "Dashboard",
    href: "/dashboard",
    roles: ["OWNER", "ADMIN", "SITE_ADMIN", "SUPERVISOR", "USER"],
  },

  // Main sections
  {
    name: "SOPs",
    href: "/admin/sops",
    roles: ["OWNER", "ADMIN"],
    siteHref: (siteId: string) => `/sites/${siteId}/sops`,
    siteRoles: ["SITE_ADMIN", "SUPERVISOR", "USER"],
  },
  {
    name: "Training",
    href: "/admin/training",
    roles: ["OWNER", "ADMIN"],
    siteHref: (siteId: string) => `/sites/${siteId}/training`,
    siteRoles: ["SITE_ADMIN", "SUPERVISOR", "USER"],
  },
  {
    name: "Documents",
    href: "/admin/documents",
    roles: ["OWNER", "ADMIN"],
    siteHref: (siteId: string) => `/sites/${siteId}/documents`,
    siteRoles: ["SITE_ADMIN", "SUPERVISOR", "USER"],
  },

  // Configuration sections - for OWNER/ADMIN at global level
  {
    name: "Users",
    href: "/admin/users",
    roles: ["OWNER", "ADMIN"],
    siteHref: (siteId: string) => `/sites/${siteId}/users`,
    siteRoles: ["SITE_ADMIN"],
  },
  {
    name: "Departments",
    href: "/admin/departments",
    roles: ["OWNER", "ADMIN"],
    siteHref: (siteId: string) => `/sites/${siteId}/departments`,
    siteRoles: ["SITE_ADMIN"],
  },
  {
    name: "Positions",
    href: "/admin/positions",
    roles: ["OWNER", "ADMIN"],
    siteHref: (siteId: string) => `/sites/${siteId}/positions`,
    siteRoles: ["SITE_ADMIN"],
  },

  // Admin sections
  { name: "Admin", href: "/admin", roles: ["OWNER", "ADMIN"] },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedSite, setSelectedSite] = useState<string>("");

  // Set initial selected site when session loads
  useEffect(() => {
    if (session?.user?.site) {
      setSelectedSite(session.user.site.id);
    }
  }, [session]);

  if (!session) return null;

  const userRole = session.user.role;
  const isSiteAdmin = userRole === "SITE_ADMIN";
  const adminSites = (session.user as SessionUser).adminSites || [];

  // Filter navigation items based on user role
  const navigation = baseNavigation.filter((item) => {
    if (isSiteAdmin) {
      return item.siteRoles?.includes(userRole) || false;
    }
    return item.roles.includes(userRole);
  });

  // Handle site selection
  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId);
    // Update the URL to reflect the selected site
    const currentPath = pathname.split("/");
    if (currentPath[1] === "sites") {
      currentPath[2] = siteId;
      router.push(currentPath.join("/"));
    }
  };

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navigation.map((item) => {
        const href = isSiteAdmin && item.siteHref && selectedSite
          ? item.siteHref(selectedSite)
          : item.href;

        return (
          <Link
            key={item.name}
            href={href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === href
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.name}
          </Link>
        );
      })}

      {/* Site selector for site admins */}
      {isSiteAdmin && adminSites.length > 0 && (
        <Select value={selectedSite} onValueChange={handleSiteChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select site" />
          </SelectTrigger>
          <SelectContent>
            {adminSites.map((site: Site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </nav>
  );
}
