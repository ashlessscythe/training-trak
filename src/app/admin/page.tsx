"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminUserApproval from "@/components/admin-user-approval";
import { useUser } from "@stackframe/stack";
import { PERMISSIONS } from "@/lib/permissions";

export default function AdminPage() {
  const user = useUser();

  // Check if user is logged in
  if (!user) {
    redirect("/handler/sign-in");
    return null;
  }

  // Check if user has admin permissions
  const isAdmin = user.usePermission(PERMISSIONS.ADMIN);
  const isOwner = user.usePermission(PERMISSIONS.OWNER);

  if (!isAdmin && !isOwner) {
    redirect("/dashboard");
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
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* User Approval Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">User Approvals</h2>
        <AdminUserApproval />
      </div>

      <h2 className="text-2xl font-bold mb-4">Admin Tools</h2>
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
