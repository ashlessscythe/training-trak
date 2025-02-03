import { Role, SOP } from "@prisma/client";
import { useResourceList } from "./useResourceList";

interface SOPFilters {
  status: "ALL" | "ACTIVE" | "INACTIVE";
  role: Role | "ALL";
}

type SOPWithRelations = SOP & {
  createdBy: {
    name: string;
    email?: string;
    siteId?: string;
  };
  lastModifiedBy: {
    name: string;
    email?: string;
    siteId?: string;
  };
  documents?: { url: string }[];
};

interface UseSOPsOptions {
  siteId?: string;
}

export function useSOPs({ siteId }: UseSOPsOptions) {
  const baseUrl = siteId ? `/api/sites/${siteId}/sops` : "/api/sops";

  const filterConfig = {
    status: {
      predicate: (
        sop: SOPWithRelations,
        value: "ALL" | "ACTIVE" | "INACTIVE"
      ) => {
        if (value === "ALL") return true;
        return value === "ACTIVE" ? sop.isActive : !sop.isActive;
      },
    },
    role: {
      predicate: (sop: SOPWithRelations, value: Role | "ALL") => {
        if (value === "ALL") return true;
        return sop.requiredRoles.includes(value);
      },
    },
  };

  const {
    resources: sops,
    isLoading,
    isDialogOpen,
    selectedResource: selectedSOP,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedResource: setSelectedSOP,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchResources: fetchSOPs,
    handleCreateResource: handleCreate,
    handleUpdateResource: handleUpdate,
    handleDeleteResource: handleDelete,
  } = useResourceList<SOPWithRelations, SOPFilters>({
    fetchUrl: baseUrl,
    filterOptions: [
      {
        key: "status",
        value: "ALL",
        predicate: filterConfig.status.predicate,
      },
      {
        key: "role",
        value: "ALL",
        predicate: filterConfig.role.predicate,
      },
    ],
    sortOptions: [
      {
        key: "date",
        getValue: (sop) => new Date(sop.updatedAt),
      },
      {
        key: "name",
        getValue: (sop) => sop.name,
      },
      {
        key: "version",
        getValue: (sop) => sop.version,
      },
    ],
    onCreateResource: async (data) => {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create SOP");
      }
    },
    onUpdateResource: async (data) => {
      const response = await fetch(baseUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update SOP");
      }
    },
    onDeleteResource: async (id) => {
      const response = await fetch(`${baseUrl}?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete SOP");
      }
    },
  });

  const formatRole = (role: Role) => {
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return {
    sops,
    isLoading,
    isDialogOpen,
    selectedSOP,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedSOP,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchSOPs,
    handleCreate,
    handleUpdate,
    handleDelete,
    formatRole,
  };
}
