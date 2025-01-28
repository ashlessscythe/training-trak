"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Role, Site, User } from "@prisma/client";
import { UserDialog } from "@/components/user-dialog";

type UserWithRelations = User & {
  site: Site;
  trainings: { status: string }[];
  uploadedDocs: { id: string }[];
  createdSOPs: { id: string }[];
};

function formatRole(role: Role) {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function getUserStats(user: UserWithRelations) {
  const totalTrainings = user.trainings.length;
  const completedTrainings = user.trainings.filter(
    (t) => t.status === "APPROVED"
  ).length;
  const uploadedDocs = user.uploadedDocs.length;
  const createdSOPs = user.createdSOPs.length;

  return {
    totalTrainings,
    completedTrainings,
    trainingProgress: totalTrainings
      ? Math.round((completedTrainings / totalTrainings) * 100)
      : 0,
    uploadedDocs,
    createdSOPs,
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRelations[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<
    UserWithRelations | undefined
  >();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, sitesRes] = await Promise.all([
          fetch("/api/users").then((res) => res.json()),
          fetch("/api/sites").then((res) => res.json()),
        ]);
        setUsers(usersRes);
        setSites(sitesRes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateUser = async (data: any) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }

      setIsDialogOpen(false);
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateUser = async (data: any) => {
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      setIsDialogOpen(false);
      setSelectedUser(undefined);
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Create User</Button>
      </div>

      <div className="grid gap-6">
        {users.map((user) => {
          const stats = getUserStats(user);

          return (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                          : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    {user.isActive && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Details</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">Site:</dt>
                        <dd className="inline ml-1">{user.site.name}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">Role:</dt>
                        <dd className="inline ml-1">{formatRole(user.role)}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Member since:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Activity</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">
                          Training progress:
                        </dt>
                        <dd className="inline ml-1">
                          {stats.completedTrainings} / {stats.totalTrainings} (
                          {stats.trainingProgress}%)
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Documents uploaded:
                        </dt>
                        <dd className="inline ml-1">{stats.uploadedDocs}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          SOPs created:
                        </dt>
                        <dd className="inline ml-1">{stats.createdSOPs}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <UserDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedUser(undefined);
        }}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        sites={sites}
        user={selectedUser}
        title={selectedUser ? "Edit User" : "Create User"}
      />
    </div>
  );
}
