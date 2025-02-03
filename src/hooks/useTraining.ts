import { TrainingProgress, TrainingStatus } from "@prisma/client";
import { useResourceList } from "./useResourceList";
import { useMemo } from "react";

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
  const baseUrl = useMemo(() => "/api/trainings", []);

  const filterConfig = useMemo(
    () => ({
      status: {
        predicate: (
          training: TrainingWithRelations,
          value: TrainingStatus | "ALL"
        ) => {
          if (value === "ALL") return true;
          return training.status === value;
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
          key: "status" as keyof TrainingFilters,
          value: "ALL",
          predicate: filterConfig.status.predicate,
        },
      ],
      sortOptions: [
        {
          key: "date",
          getValue: (training: TrainingWithRelations) =>
            new Date(training.updatedAt),
        },
        {
          key: "name",
          getValue: (training: TrainingWithRelations) => training.sop.name,
        },
        {
          key: "status",
          getValue: (training: TrainingWithRelations) => training.status,
        },
      ],
      onUpdateResource: async (data: any) => {
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
    }),
    [baseUrl, filterConfig]
  );

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
  } = useResourceList<TrainingWithRelations, TrainingFilters>(resourceOptions);

  // Filter trainings for specific site if siteId is provided
  const filteredTrainings = useMemo(
    () =>
      siteId
        ? trainings.filter(
            (training) =>
              training.user.siteId === siteId ||
              training.sop.createdBy.siteId === siteId
          )
        : trainings,
    [siteId, trainings]
  );

  const getStatusColor = useMemo(
    () => (status: TrainingStatus) => {
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
    },
    []
  );

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
