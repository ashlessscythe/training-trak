import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Role, Site, Department, Position } from "@prisma/client";
import { UserDialog } from "@/components/user-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useUsers } from "@/hooks/useUsers";
import { useEffect } from "react";
import { ListView } from "@/components/list-view";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { useListView } from "@/hooks/useListView";

interface UsersListProps {
  siteId?: string;
  title?: string;
  sites: Site[];
  departments: Department[];
  positions: Position[];
}

export function UsersList({
  siteId,
  title = "Users",
  sites,
  departments,
  positions,
}: UsersListProps) {
  const {
    users,
    isLoading,
    isDialogOpen,
    selectedUser,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedUser,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchUsers,
    handleCreate,
    handleUpdate,
    handleDelete,
    getUserStats,
    formatRole,
  } = useUsers({ siteId, sites, departments, positions });

  const { viewMode, setViewMode, currentView } = useListView();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const columns = [
    {
      header: "Name",
      accessor: (user: any) => (
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (user: any) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
            user.isActive
              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
          }`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      ),
      className: "w-24",
    },
    {
      header: "Department",
      accessor: (user: any) => (
        <div>
          <div>{user.department.name}</div>
          <div className="text-sm text-muted-foreground">
            {user.position.name}
          </div>
        </div>
      ),
      className: "w-48",
    },
    {
      header: "Training",
      accessor: (user: any) => {
        const stats = getUserStats(user);
        return (
          <div>
            <div>
              {stats.completedTrainings} / {stats.totalTrainings} Complete
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.trainingProgress}% Progress
            </div>
          </div>
        );
      },
      className: "w-36",
    },
    {
      header: "Actions",
      accessor: (user: any) => (
        <div className="flex items-center space-x-2">
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
              onClick={() => handleDelete(user.id)}
            >
              Deactivate
            </Button>
          )}
        </div>
      ),
      className: "w-48",
    },
  ];

  if (!siteId) {
    // Insert site and role columns after name for global view
    columns.splice(1, 0, {
      header: "Site",
      accessor: (user: any) => (
        <div className="font-medium">{user.site.name}</div>
      ),
      className: "w-36",
    });
    columns.splice(2, 0, {
      header: "Role",
      accessor: (user: any) => (
        <div className="font-medium">{formatRole(user.role)}</div>
      ),
      className: "w-36",
    });
  }

  const renderCard = (user: any) => {
    const stats = getUserStats(user);

    return (
      <Card key={user.id}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
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
                  onClick={() => handleDelete(user.id)}
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
                {!siteId && (
                  <div>
                    <dt className="inline text-muted-foreground">Site:</dt>
                    <dd className="inline ml-1">{user.site.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline text-muted-foreground">Department:</dt>
                  <dd className="inline ml-1">{user.department.name}</dd>
                </div>
                <div>
                  <dt className="inline text-muted-foreground">Position:</dt>
                  <dd className="inline ml-1">{user.position.name}</dd>
                </div>
                {!siteId && (
                  <div>
                    <dt className="inline text-muted-foreground">Role:</dt>
                    <dd className="inline ml-1">{formatRole(user.role)}</dd>
                  </div>
                )}
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
  };

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="flex items-center gap-4">
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    name: "",
                    role: "ALL",
                    site: "ALL",
                    department: "ALL",
                    position: "ALL",
                    active: "ALL",
                  });
                  setSortBy("name");
                  setSortOrder("asc");
                }}
              >
                Clear Filters
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>Create User</Button>
            </div>
          </div>
        </div>

        <div
          className={`grid gap-4 ${
            siteId
              ? "md:grid-cols-2 lg:grid-cols-5"
              : "md:grid-cols-2 lg:grid-cols-7"
          }`}
        >
          <Input
            placeholder="Search by name or email"
            value={filters.name || ""}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />

          {!siteId && (
            <Select
              value={filters.role || "ALL"}
              onValueChange={(value) =>
                setFilters({ ...filters, role: value as Role | "ALL" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                {Object.values(Role).map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRole(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!siteId && (
            <Select
              value={filters.site || "ALL"}
              onValueChange={(value) => setFilters({ ...filters, site: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={filters.department || "ALL"}
            onValueChange={(value) =>
              setFilters({ ...filters, department: value })
            }
          >
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

          <Select
            value={filters.position || "ALL"}
            onValueChange={(value) =>
              setFilters({ ...filters, position: value })
            }
          >
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
            value={filters.active || "ALL"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                active: value as "ALL" | "ACTIVE" | "INACTIVE",
              })
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
            <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                {!siteId && <SelectItem value="role">Role</SelectItem>}
                {!siteId && <SelectItem value="site">Site</SelectItem>}
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

      <ListView
        data={users}
        columns={columns}
        view={currentView}
        renderCard={renderCard}
        keyExtractor={(user) => user.id}
        emptyMessage="No users found"
      />

      <UserDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedUser(undefined);
        }}
        onSubmit={selectedUser ? handleUpdate : handleCreate}
        sites={sites}
        departments={departments}
        positions={positions}
        user={selectedUser}
        title={selectedUser ? "Edit User" : "Create User"}
      />
    </div>
  );
}
