import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    roles: ["OWNER", "ADMIN", "SUPERVISOR", "USER"],
  },
  {
    name: "SOPs",
    href: "/sops",
    roles: ["OWNER", "ADMIN", "SUPERVISOR", "USER"],
  },
  {
    name: "Training",
    href: "/training",
    roles: ["OWNER", "ADMIN", "SUPERVISOR", "USER"],
  },
  {
    name: "Documents",
    href: "/documents",
    roles: ["OWNER", "ADMIN", "SUPERVISOR", "USER"],
  },
  { name: "Admin", href: "/admin", roles: ["OWNER", "ADMIN"] },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "PENDING";

  const filteredNavigation = navigation.filter((item) =>
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
