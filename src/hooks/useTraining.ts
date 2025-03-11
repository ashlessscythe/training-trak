import { TrainingProgress, TrainingStatus } from "@prisma/client";
import { useResourceList } from "./useResourceList";
import { useMemo, useState } from "react";
import { TrainingViewType } from "@/components/training-view-selector";
import { getTrainingStatusColor } from "@/lib/utils";

interface TrainingFilters {
  status: TrainingStatus | "ALL";
  viewType: TrainingViewType;
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

  const groupedTrainings = useMemo(() => {
    const groupByType = (trainings: TrainingWithRelations[]) => {
      switch (viewType) {
        case "user":
          return trainings.reduce((acc, training) => {
            const userName = training.user.name;
            if (!acc[userName]) {
              acc[userName] = [];
            }
            acc[userName].push(training);
            return acc;
          }, {} as Record<string, TrainingWithRelations[]>);
        case "department":
          return trainings.reduce((acc, training) => {
            const deptName = training.user.department?.name || "No Department";
            if (!acc[deptName]) {
              acc[deptName] = [];
            }
            acc[deptName].push(training);
            return acc;
          }, {} as Record<string, TrainingWithRelations[]>);
        case "sop":
        default:
          return trainings.reduce((acc, training) => {
            const sopName = training.sop.name;
            if (!acc[sopName]) {
              acc[sopName] = [];
            }
            acc[sopName].push(training);
            return acc;
          }, {} as Record<string, TrainingWithRelations[]>);
      }
    };
    return groupByType(trainings);
  }, [trainings, viewType]);

  const getStatusColor = useMemo(
    () => (status: TrainingStatus) => {
      return getTrainingStatusColor(status);
    },
    []
  );

  return {
    trainings,
    groupedTrainings,
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
