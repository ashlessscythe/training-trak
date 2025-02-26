import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
const baseNavigation = [
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
    href: "/admin/training", // Changed from "/training" to "/admin/training"
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

  // Admin sections
  { name: "Admin", href: "/admin", roles: ["OWNER", "ADMIN"] },

  // Configuration sections - for OWNER/ADMIN at global level
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
];

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "PENDING";
  // Add site users link for site admins
  // Build navigation based on user role and site
  const buildNavigation = () => {
    let nav = [...baseNavigation];
    const siteId = session?.user?.site?.id;

    // Add site-specific management links for site admins
    if (userRole === "SITE_ADMIN" && siteId) {
      nav.push({
        name: "Site Users",
        href: `/sites/${siteId}/users`,
        roles: ["SITE_ADMIN"],
      });
    }

    // Convert navigation items to their final form
    return nav.map((item) => {
      // If user is a supervisor or regular user and item has a site-specific version
      if (
        ["SITE_ADMIN", "SUPERVISOR", "USER"].includes(userRole) &&
        item.siteHref &&
        item.siteRoles?.includes(userRole) &&
        siteId
      ) {
        return {
          ...item,
          href: item.siteHref(siteId),
          roles: item.siteRoles,
        };
      }
      // For admin/owner, keep original href and roles
      return {
        name: item.name,
        href: item.href,
        roles: item.roles,
      };
    });
  };

  const filteredNavigation = buildNavigation().filter((item) =>
    item.roles.includes(userRole as string)
  );

  return (
    <nav className="flex space-x-4 lg:space-x-6">
      {filteredNavigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
