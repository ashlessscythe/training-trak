"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Position, SOP } from "@prisma/client";

interface PositionWithSOPs extends Position {
  sops?: SOP[];
}
import { PositionDialog } from "@/components/position-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { ListView } from "@/components/list-view";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { useListView } from "@/hooks/useListView";

export default function PositionsPage() {
  const params = useParams();
  const siteId = params.id as string;
  const [positions, setPositions] = useState<PositionWithSOPs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<
    PositionWithSOPs | undefined
  >();
  const [nameFilter, setNameFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { viewMode, setViewMode, currentView } = useListView();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/sites/${siteId}/positions`);
        const data = await response.json();
        setPositions(data);
      } catch (error) {
        console.error("Failed to fetch positions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  const handleCreatePosition = async (data: any) => {
    try {
      const response = await fetch(`/api/sites/${siteId}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, siteId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create position");
      }

      const newPosition = await response.json();
      setPositions((prev) => [...prev, newPosition]);
      setIsDialogOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdatePosition = async (data: any) => {
    try {
      const response = await fetch(`/api/sites/${siteId}/positions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, siteId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update position");
      }

      const updatedPosition = await response.json();
      setPositions((prev) =>
        prev.map((pos) =>
          pos.id === updatedPosition.id ? updatedPosition : pos
        )
      );
      setIsDialogOpen(false);
      setSelectedPosition(undefined);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm("Are you sure you want to delete this position?")) return;

    try {
      const response = await fetch(
        `/api/sites/${siteId}/positions?id=${positionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete position");
      }

      setPositions((prev) => prev.filter((pos) => pos.id !== positionId));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredAndSortedPositions = useMemo(() => {
    let filtered = [...positions];

    // Apply name filter
    if (nameFilter) {
      filtered = filtered.filter((position) =>
        position.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [positions, nameFilter, sortBy, sortOrder]);

  // Function to render a position card
  const renderPositionCard = (position: PositionWithSOPs) => (
    <Card key={position.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{position.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPosition(position);
                setIsDialogOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeletePosition(position.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {position.description || "No description provided"}
          </p>
          <div>
            <p className="text-sm font-medium">Required SOPs:</p>
            <p className="text-sm text-muted-foreground">
              {(position.sops || []).length > 0
                ? (position.sops || [])
                    .filter((sop) => sop.isActive)
                    .map((sop) => `${sop.name} (v${sop.version})`)
                    .join(", ")
                : "No SOPs required"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Created: {new Date(position.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );

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
          <h1 className="text-3xl font-bold">Positions</h1>
          <div className="flex items-center gap-4">
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNameFilter("");
                  setSortBy("name");
                  setSortOrder("asc");
                }}
              >
                Clear Filters
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Position
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input
            placeholder="Search by name"
            value={nameFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNameFilter(e.target.value)
            }
          />

          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(value: "name" | "createdAt") => setSortBy(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
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

      {Array.isArray(filteredAndSortedPositions) &&
      filteredAndSortedPositions.length > 0 ? (
        <ListView
          data={filteredAndSortedPositions}
          columns={[
            {
              header: "Name",
              accessor: "name",
            },
            {
              header: "Description",
              accessor: (position) => position.description || "No description provided",
              className: "max-w-md truncate",
            },
            {
              header: "Required SOPs",
              accessor: (position) => 
                (position.sops || []).length > 0
                  ? (position.sops || [])
                      .filter((sop) => sop.isActive)
                      .map((sop) => `${sop.name} (v${sop.version})`)
                      .join(", ")
                  : "No SOPs required",
              className: "max-w-md truncate",
            },
            {
              header: "Created",
              accessor: (position) => new Date(position.createdAt).toLocaleDateString(),
              className: "w-32",
            },
            {
              header: "Actions",
              accessor: (position) => (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPosition(position);
                      setIsDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePosition(position.id)}
                  >
                    Delete
                  </Button>
                </div>
              ),
              className: "w-48",
            },
          ]}
          view={currentView}
          renderCard={renderPositionCard}
          keyExtractor={(position) => position.id}
          emptyMessage="No positions found"
        />
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No positions found
            </p>
          </CardContent>
        </Card>
      )}

      <PositionDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPosition(undefined);
        }}
        onSubmit={
          selectedPosition ? handleUpdatePosition : handleCreatePosition
        }
        position={selectedPosition}
        title={selectedPosition ? "Edit Position" : "Create Position"}
      />
    </div>
  );
}
