import { Role, Site, User, Department, Position } from "@prisma/client";
import { useResourceList } from "./useResourceList";
import { useMemo } from "react";

interface UserFilters {
  name: string;
  role: Role | "ALL";
  site: string | "ALL";
  department: string | "ALL";
  position: string | "ALL";
  shift: string | "ALL";
  active: "ALL" | "ACTIVE" | "INACTIVE";
}

type UserWithRelations = User & {
  site: Site;
  role: Role;
  department: Department;
  position: Position;
  trainings: { status: string }[];
  uploadedDocs: { id: string }[];
  createdSOPs: { id: string }[];
};

interface UseUsersOptions {
  siteId?: string;
  sites: Site[];
  roles: Role[];
  departments: Department[];
  positions: Position[];
}

export function useUsers({
  siteId,
  sites,
  roles,
  departments,
  positions,
}: UseUsersOptions) {
  const baseUrl = useMemo(
    () => (siteId ? `/api/sites/${siteId}/users` : "/api/users"),
    [siteId]
  );

  const filterConfig = useMemo(
    () => ({
      name: {
        predicate: (user: UserWithRelations, value: string) => {
          if (!value) return true;
          return (
            user.name.toLowerCase().includes(value.toLowerCase()) ||
            user.email.toLowerCase().includes(value.toLowerCase())
          );
        },
      },
      role: {
        predicate: (user: UserWithRelations, value: Role | "ALL") => {
          if (value === "ALL") return true;
          return user.role === value;
        },
      },
      site: {
        predicate: (user: UserWithRelations, value: string | "ALL") => {
          if (value === "ALL") return true;
          return user.site.id === value;
        },
      },
      department: {
        predicate: (user: UserWithRelations, value: string | "ALL") => {
          if (value === "ALL") return true;
          return user.department.id === value;
        },
      },
      position: {
        predicate: (user: UserWithRelations, value: string | "ALL") => {
          if (value === "ALL") return true;
          return user.position.id === value;
        },
      },
      shift: {
        predicate: (user: UserWithRelations, value: string | "ALL") => {
          if (value === "ALL") return true;
          return user.shift === value;
        },
      },
      active: {
        predicate: (
          user: UserWithRelations,
          value: "ALL" | "ACTIVE" | "INACTIVE"
        ) => {
          if (value === "ALL") return true;
          return value === "ACTIVE" ? user.isActive : !user.isActive;
        },
      },
    }),
    []
  );

  const resourceOptions = useMemo(
    () => ({
      fetchUrl: baseUrl,
      filterOptions: [
        {
          key: "name" as keyof UserFilters,
          value: "",
          predicate: filterConfig.name.predicate,
        },
        {
          key: "role" as keyof UserFilters,
          value: "ALL",
          predicate: filterConfig.role.predicate,
        },
        {
          key: "site" as keyof UserFilters,
          value: "ALL",
          predicate: filterConfig.site.predicate,
        },
        {
          key: "department" as keyof UserFilters,
          value: "ALL",
          predicate: filterConfig.department.predicate,
        },
        {
          key: "position" as keyof UserFilters,
          value: "ALL",
          predicate: filterConfig.position.predicate,
        },
        {
          key: "shift" as keyof UserFilters,
          value: "ALL",
          predicate: filterConfig.shift.predicate,
        },
        {
          key: "active" as keyof UserFilters,
          value: "ALL",
          predicate: filterConfig.active.predicate,
        },
      ],
      sortOptions: [
        {
          key: "name",
          getValue: (user: UserWithRelations) => user.name,
        },
        {
          key: "role",
          getValue: (user: UserWithRelations) => user.role,
        },
        {
          key: "site",
          getValue: (user: UserWithRelations) => user.site.name,
        },
        {
          key: "department",
          getValue: (user: UserWithRelations) => user.department.name,
        },
        {
          key: "position",
          getValue: (user: UserWithRelations) => user.position.name,
        },
        {
          key: "shift",
          getValue: (user: UserWithRelations) => user.shift || "",
        },
        {
          key: "createdAt",
          getValue: (user: UserWithRelations) => new Date(user.createdAt),
        },
      ],
      onCreateResource: async (data: any) => {
        const response = await fetch(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create user");
        }
      },
      onUpdateResource: async (data: any) => {
        const response = await fetch(baseUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update user");
        }
      },
      onDeleteResource: async (id: string) => {
        const response = await fetch(`${baseUrl}?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to delete user");
        }
      },
    }),
    [baseUrl, filterConfig]
  );

  const {
    resources: users,
    isLoading,
    isDialogOpen,
    selectedResource: selectedUser,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedResource: setSelectedUser,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchResources: fetchUsers,
    handleCreateResource: handleCreate,
    handleUpdateResource: handleUpdate,
    handleDeleteResource: handleDelete,
  } = useResourceList<UserWithRelations, UserFilters>(resourceOptions);

  const getUserStats = useMemo(
    () => (user: UserWithRelations) => {
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
    },
    []
  );

  const formatRole = useMemo(
    () => (role: Role) => {
      return role
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");
    },
    []
  );

  return {
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
    sites,
    departments,
    positions,
  };
}
