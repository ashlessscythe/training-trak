import { useState, useCallback, useMemo, useEffect } from "react";

export interface ResourceListOptions<T, F = string> {
  fetchUrl: string;
  onCreateResource?: (data: Partial<T>) => Promise<void>;
  onUpdateResource?: (data: Partial<T>) => Promise<void>;
  onDeleteResource?: (id: string) => Promise<void>;
  filterOptions?: {
    key: keyof F;
    value: any;
    predicate: (item: T, value: any) => boolean;
  }[];
  sortOptions?: {
    key: string;
    getValue: (item: T) => any;
  }[];
}

export function useResourceList<T extends { id: string }, F = string>(
  options: ResourceListOptions<T, F>
) {
  const [resources, setResources] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<T | undefined>();
  const [filters, setFilters] = useState<Partial<Record<keyof F, any>>>({});
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchResources = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch(options.fetchUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch resources"
      );
    } finally {
      setIsLoading(false);
    }
  }, [options.fetchUrl]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleCreateResource = useCallback(
    async (data: Partial<T>) => {
      try {
        setError(null);
        if (options.onCreateResource) {
          await options.onCreateResource(data);
        }
        setIsDialogOpen(false);
        await fetchResources();
      } catch (error: any) {
        setError(error.message || "Failed to create resource");
        throw error;
      }
    },
    [options, fetchResources]
  );

  const handleUpdateResource = useCallback(
    async (data: Partial<T>) => {
      try {
        setError(null);
        if (options.onUpdateResource) {
          await options.onUpdateResource(data);
        }
        setIsDialogOpen(false);
        setSelectedResource(undefined);
        await fetchResources();
      } catch (error: any) {
        setError(error.message || "Failed to update resource");
        throw error;
      }
    },
    [options, fetchResources]
  );

  const handleDeleteResource = useCallback(
    async (id: string) => {
      try {
        setError(null);
        if (options.onDeleteResource) {
          await options.onDeleteResource(id);
        }
        await fetchResources();
      } catch (error: any) {
        setError(error.message || "Failed to delete resource");
        throw error;
      }
    },
    [options, fetchResources]
  );

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      if (!options.filterOptions) return true;
      return options.filterOptions.every((filterOption) => {
        const filterValue = filters[filterOption.key as keyof F];
        if (!filterValue || filterValue === "ALL") return true;
        return filterOption.predicate(resource, filterValue);
      });
    });
  }, [resources, options.filterOptions, filters]);

  const sortedResources = useMemo(() => {
    return [...filteredResources].sort((a, b) => {
      const sortOption = options.sortOptions?.find((opt) => opt.key === sortBy);
      if (!sortOption) return 0;

      const valueA = sortOption.getValue(a);
      const valueB = sortOption.getValue(b);

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (valueA instanceof Date && valueB instanceof Date) {
        return sortOrder === "asc"
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      return 0;
    });
  }, [filteredResources, options.sortOptions, sortBy, sortOrder]);

  return {
    resources: sortedResources,
    isLoading,
    error,
    isDialogOpen,
    selectedResource,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedResource,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchResources,
    handleCreateResource,
    handleUpdateResource,
    handleDeleteResource,
  };
}
