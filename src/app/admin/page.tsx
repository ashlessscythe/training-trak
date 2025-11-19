"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;

  useEffect(() => {
    if (status === "authenticated" && !["OWNER", "ADMIN"].includes(userRole as string)) {
      router.push("/dashboard");
    }
  }, [status, userRole, router]);

  if (status === "loading") {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session || !["OWNER", "ADMIN"].includes(userRole as string)) {
    return null;
  }

  const adminLinks = [
    {
      name: "Users",
      href: "/admin/users",
      description: "Manage user accounts and permissions",
    },
    {
      name: "Sites",
      href: "/admin/sites",
      description: "Manage company locations and facilities",
    },
    {
      name: "Departments",
      href: "/admin/departments",
      description: "Manage organizational departments",
    },
    {
      name: "Positions",
      href: "/admin/positions",
      description: "Manage job positions and roles",
    },
    {
      name: "Training Status",
      href: "/admin/training",
      description: "View training status across all sites",
    },
    {
      name: "Email Test",
      href: "/admin/email-test",
      description: "Test email templates with custom parameters",
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">{link.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {link.description}
                </p>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
