import { TrainingProgress, TrainingStatus } from "@prisma/client";
import { useResourceList } from "./useResourceList";

interface TrainingFilters {
  status: TrainingStatus | "ALL";
}

type TrainingWithRelations = TrainingProgress & {
  user: {
    name: string;
    siteId: string;
  };
  sop: {
    name: string;
    version: string;
    createdBy: {
      siteId: string;
    };
  };
  approvedBy: {
    name: string;
  } | null;
};

interface UseTrainingOptions {
  siteId?: string;
}

export function useTraining({ siteId }: UseTrainingOptions) {
  const baseUrl = "/api/trainings";

  const filterConfig = {
    status: {
      predicate: (
        training: TrainingWithRelations,
        value: TrainingStatus | "ALL"
      ) => {
        if (value === "ALL") return true;
        return training.status === value;
      },
    },
  };

  const {
    resources: trainings,
    isLoading,
    isDialogOpen,
    selectedResource: selectedTraining,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedResource: setSelectedTraining,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchResources: fetchTrainings,
    handleUpdateResource: handleUpdate,
  } = useResourceList<TrainingWithRelations, TrainingFilters>({
    fetchUrl: baseUrl,
    filterOptions: [
      {
        key: "status",
        value: "ALL",
        predicate: filterConfig.status.predicate,
      },
    ],
    sortOptions: [
      {
        key: "date",
        getValue: (training) => new Date(training.updatedAt),
      },
      {
        key: "name",
        getValue: (training) => training.sop.name,
      },
      {
        key: "status",
        getValue: (training) => training.status,
      },
    ],
    onUpdateResource: async (data) => {
      const response = await fetch(baseUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update training");
      }
    },
  });

  // Filter trainings for specific site if siteId is provided
  const filteredTrainings = siteId
    ? trainings.filter(
        (training) =>
          training.user.siteId === siteId ||
          training.sop.createdBy.siteId === siteId
      )
    : trainings;

  const getStatusColor = (status: TrainingStatus) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600";
      case "REJECTED":
        return "text-red-600";
      case "COMPLETED":
        return "text-blue-600";
      default:
        return "text-yellow-600";
    }
  };

  return {
    trainings: filteredTrainings,
    isLoading,
    isDialogOpen,
    selectedTraining,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedTraining,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchTrainings,
    handleUpdate,
    getStatusColor,
  };
}
