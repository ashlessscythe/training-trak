"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Role, Site, User, Department, Position } from "@prisma/client";
import { UserDialog } from "@/components/user-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useParams } from "next/navigation";

type UserWithRelations = User & {
  site: Site;
  department: Department;
  position: Position;
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

export default function SiteUsersPage() {
  const params = useParams();
  const siteId = params.id as string;

  // Initialize with empty array and proper type
  const [users, setUsers] = useState<UserWithRelations[]>(() => []);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<
    UserWithRelations | undefined
  >();
  const [nameFilter, setNameFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [positionFilter, setPositionFilter] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [sortBy, setSortBy] = useState<
    "name" | "department" | "position" | "createdAt"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, departmentsRes, positionsRes] = await Promise.all([
          fetch(`/api/sites/${siteId}/users`).then((res) => res.json()),
          fetch("/api/departments").then((res) => res.json()),
          fetch("/api/positions").then((res) => res.json()),
        ]);

        // Ensure we have arrays even if the response is null/undefined
        setUsers(Array.isArray(usersRes) ? usersRes : []);
        setDepartments(Array.isArray(departmentsRes) ? departmentsRes : []);
        setPositions(Array.isArray(positionsRes) ? positionsRes : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  const handleCreateUser = async (data: any) => {
    try {
      const response = await fetch(`/api/sites/${siteId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }

      const newUser = await response.json();
      // Add site, department, and position objects to match the expected shape
      const userWithRelations = {
        ...newUser,
        site: { id: siteId, name: users[0]?.site.name || "" }, // Use existing site name
        department: departments.find((d) => d.id === newUser.departmentId)!,
        position: positions.find((p) => p.id === newUser.positionId)!,
        trainings: [],
        uploadedDocs: [],
        createdSOPs: [],
      };

      setUsers((prev) => [...prev, userWithRelations]);
      setIsDialogOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateUser = async (data: any) => {
    try {
      const response = await fetch(`/api/sites/${siteId}/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      const updatedUser = await response.json();
      // Update user while preserving related data structure
      setUsers((prev) =>
        prev.map((user) => {
          if (user.id === updatedUser.id) {
            return {
              ...user,
              ...updatedUser,
              site: user.site,
              department: departments.find(
                (d) => d.id === updatedUser.departmentId
              )!,
              position: positions.find((p) => p.id === updatedUser.positionId)!,
            };
          }
          return user;
        })
      );

      setIsDialogOpen(false);
      setSelectedUser(undefined);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      const response = await fetch(`/api/sites/${siteId}/users?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      const deactivatedUser = await response.json();
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive: false } : user
        )
      );
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    // Ensure we're working with an array
    let filtered = Array.isArray(users) ? [...users] : [];

    // Apply filters
    if (nameFilter) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
          user.email.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (departmentFilter !== "ALL") {
      filtered = filtered.filter(
        (user) => user.department.id === departmentFilter
      );
    }

    if (positionFilter !== "ALL") {
      filtered = filtered.filter((user) => user.position.id === positionFilter);
    }

    if (activeFilter !== "ALL") {
      filtered = filtered.filter((user) =>
        activeFilter === "ACTIVE" ? user.isActive : !user.isActive
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "department":
          comparison = a.department.name.localeCompare(b.department.name);
          break;
        case "position":
          comparison = a.position.name.localeCompare(b.position.name);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    users,
    nameFilter,
    departmentFilter,
    positionFilter,
    activeFilter,
    sortBy,
    sortOrder,
  ]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Site Users</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setNameFilter("");
                setDepartmentFilter("ALL");
                setPositionFilter("ALL");
                setActiveFilter("ALL");
                setSortBy("name");
                setSortOrder("asc");
              }}
            >
              Clear Filters
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>Create User</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Search by name or email"
            value={nameFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNameFilter(e.target.value)
            }
          />

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Positions</SelectItem>
              {positions.map((position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={activeFilter}
            onValueChange={(value: "ALL" | "ACTIVE" | "INACTIVE") =>
              setActiveFilter(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(
                value: "name" | "department" | "position" | "createdAt"
              ) => setSortBy(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="position">Position</SelectItem>
                <SelectItem value="createdAt">Date Created</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </div>
      <div className="mb-4"></div>

      <div className="grid gap-6">
        {Array.isArray(filteredAndSortedUsers) &&
        filteredAndSortedUsers.length > 0 ? (
          filteredAndSortedUsers.map((user) => {
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
                          <dt className="inline text-muted-foreground">
                            Department:
                          </dt>
                          <dd className="inline ml-1">
                            {user.department.name}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline text-muted-foreground">
                            Position:
                          </dt>
                          <dd className="inline ml-1">{user.position.name}</dd>
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
                            {stats.completedTrainings} / {stats.totalTrainings}{" "}
                            ({stats.trainingProgress}%)
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
          })
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No users found
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <UserDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedUser(undefined);
        }}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        sites={[
          {
            id: siteId,
            name: users[0]?.site.name || "",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            description: null,
            code: users[0]?.site.code || "",
          },
        ]} // Only show current site
        departments={departments}
        positions={positions}
        user={selectedUser}
        title={selectedUser ? "Edit User" : "Create User"}
      />
    </div>
  );
}
