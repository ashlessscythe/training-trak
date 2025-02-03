import { useState } from "react";

export interface ResourceListOptions<T, F = string> {
  fetchUrl: string;
  onCreateResource?: (data: any) => Promise<void>;
  onUpdateResource?: (data: any) => Promise<void>;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<T | undefined>();
  const [filters, setFilters] = useState<Partial<Record<keyof F, any>>>({});
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchResources = async () => {
    try {
      const response = await fetch(options.fetchUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateResource = async (data: any) => {
    try {
      if (options.onCreateResource) {
        await options.onCreateResource(data);
      }
      setIsDialogOpen(false);
      await fetchResources();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateResource = async (data: any) => {
    try {
      if (options.onUpdateResource) {
        await options.onUpdateResource(data);
      }
      setIsDialogOpen(false);
      setSelectedResource(undefined);
      await fetchResources();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      if (options.onDeleteResource) {
        await options.onDeleteResource(id);
      }
      await fetchResources();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredAndSortedResources = () => {
    return resources
      .filter((resource) => {
        if (!options.filterOptions) return true;
        return options.filterOptions.every((filterOption) => {
          const filterValue = filters[filterOption.key as keyof F];
          if (!filterValue || filterValue === "ALL") return true;
          return filterOption.predicate(resource, filterValue);
        });
      })
      .sort((a, b) => {
        const sortOption = options.sortOptions?.find(
          (opt) => opt.key === sortBy
        );
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
  };

  return {
    resources: filteredAndSortedResources(),
    isLoading,
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
