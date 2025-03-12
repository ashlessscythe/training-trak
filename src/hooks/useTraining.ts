import { TrainingProgress, TrainingStatus } from "@prisma/client";
import { useResourceList } from "./useResourceList";
import { useMemo, useState, useCallback } from "react";
import { TrainingViewType } from "@/components/training-view-selector";
import { getTrainingStatusColor } from "@/lib/utils";

interface TrainingFilters {
  status: TrainingStatus | "ALL";
  viewType: TrainingViewType;
  isHistorical?: boolean;
}

export type TrainingWithRelations = TrainingProgress & {
  user: {
    id: string;
    name: string;
    siteId: string;
    department?: {
      name: string;
    };
  };
  sop: {
    id: string;
    name: string;
    version: string;
    createdBy: {
      siteId: string;
    };
  };
  approvedBy: {
    name: string;
  } | null;
  isHistorical: boolean;
  isSigned: boolean;
};

interface UseTrainingOptions {
  siteId?: string;
  userId?: string;
}

export function useTraining({ siteId, userId }: UseTrainingOptions) {
  const [viewType, setViewType] = useState<TrainingViewType>("user");
  const baseUrl = useMemo(() => {
    const base = siteId ? `/api/sites/${siteId}/trainings` : "/api/trainings";
    if (userId) {
      return `${base}?userId=${userId}`;
    }
    return base;
  }, [siteId, userId]);

  // Group trainings by type (user, department, or SOP)
  const groupTrainingsByType = useCallback(
    (trainingsToGroup: TrainingWithRelations[]) => {
      switch (viewType) {
        case "user":
          return trainingsToGroup.reduce((acc, training) => {
            const userName = training.user.name;
            if (!acc[userName]) {
              acc[userName] = [];
            }
            acc[userName].push(training);
            return acc;
          }, {} as Record<string, TrainingWithRelations[]>);
        case "department":
          return trainingsToGroup.reduce((acc, training) => {
            const deptName = training.user.department?.name || "No Department";
            if (!acc[deptName]) {
              acc[deptName] = [];
            }
            acc[deptName].push(training);
            return acc;
          }, {} as Record<string, TrainingWithRelations[]>);
        case "sop":
        default:
          return trainingsToGroup.reduce((acc, training) => {
            const sopName = training.sop.name;
            if (!acc[sopName]) {
              acc[sopName] = [];
            }
            acc[sopName].push(training);
            return acc;
          }, {} as Record<string, TrainingWithRelations[]>);
      }
    },
    [viewType] // Add viewType as a dependency since it's used inside the function
  );

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

  // Split trainings into current and historical/completed
  const currentTrainings = useMemo(() => {
    return trainings.filter(
      (training) =>
        !training.isHistorical &&
        training.status !== "COMPLETED" &&
        !training.isSigned
    );
  }, [trainings]);

  const historicalTrainings = useMemo(() => {
    return trainings.filter(
      (training) =>
        training.isHistorical ||
        training.status === "COMPLETED" ||
        training.isSigned
    );
  }, [trainings]);

  const groupedCurrentTrainings = useMemo(() => {
    return groupTrainingsByType(currentTrainings);
  }, [currentTrainings, groupTrainingsByType]);

  const groupedHistoricalTrainings = useMemo(() => {
    return groupTrainingsByType(historicalTrainings);
  }, [historicalTrainings, groupTrainingsByType]);

  const getStatusColor = useMemo(
    () => (status: TrainingStatus, isSigned?: boolean) => {
      return getTrainingStatusColor(status, isSigned);
    },
    []
  );

  return {
    trainings,
    currentTrainings,
    historicalTrainings,
    groupedCurrentTrainings,
    groupedHistoricalTrainings,
    viewType,
    setViewType,
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
