import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Role } from "@prisma/client";
import { SOPDialog } from "@/components/sop-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSOPs } from "@/hooks/useSops";
import { useEffect } from "react";
import { ListView } from "@/components/list-view";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { useListView } from "@/hooks/useListView";

interface SOPsListProps {
  siteId?: string;
  title?: string;
}

export function SOPsList({
  siteId,
  title = "Standard Operating Procedures",
}: SOPsListProps) {
  const {
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
  } = useSOPs({ siteId });

  const { viewMode, setViewMode, currentView } = useListView();

  useEffect(() => {
    fetchSOPs();
  }, [fetchSOPs]);

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
      accessor: (sop: any) => (
        <div>
          <div className="font-medium">{sop.name}</div>
          <div className="text-sm text-muted-foreground">
            Version {sop.version}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (sop: any) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
            sop.isActive
              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
          }`}
        >
          {sop.isActive ? "Active" : "Inactive"}
        </span>
      ),
      className: "w-24",
    },
    {
      header: "Required Roles",
      accessor: (sop: any) => sop.requiredRoles.map(formatRole).join(", "),
    },
    {
      header: "Required For",
      accessor: (sop: any) =>
        sop.positions?.length > 0
          ? sop.positions
              .filter((pos: any) => pos.isActive)
              .map((pos: any) => pos.name)
              .join(", ")
          : "No positions",
    },
    {
      header: "Last Modified",
      accessor: (sop: any) => (
        <div>
          <div>{new Date(sop.updatedAt).toLocaleDateString()}</div>
          <div className="text-sm text-muted-foreground">
            by {sop.lastModifiedBy.name}
          </div>
        </div>
      ),
      className: "w-48",
    },
    {
      header: "Actions",
      accessor: (sop: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSOP(sop);
              setIsDialogOpen(true);
            }}
          >
            Edit
          </Button>
          {sop.isActive && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(sop.id)}
            >
              Deactivate
            </Button>
          )}
        </div>
      ),
      className: "w-48",
    },
  ];

  const renderCard = (sop: any) => (
    <Card key={sop.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{sop.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Version {sop.version}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                sop.isActive
                  ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                  : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
              }`}
            >
              {sop.isActive ? "Active" : "Inactive"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSOP(sop);
                setIsDialogOpen(true);
              }}
            >
              Edit
            </Button>
            {sop.isActive && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(sop.id)}
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
              {sop.description && (
                <div>
                  <dt className="inline text-muted-foreground">Description:</dt>
                  <dd className="inline ml-1">{sop.description}</dd>
                </div>
              )}
              <div>
                <dt className="inline text-muted-foreground">
                  Required roles:
                </dt>
                <dd className="inline ml-1">
                  {sop.requiredRoles.map(formatRole).join(", ")}
                </dd>
              </div>
              {sop.content && (
                <div>
                  <dt className="inline text-muted-foreground">Content:</dt>
                  <dd className="inline ml-1">
                    {sop.content.startsWith("http") ? (
                      <a
                        href={sop.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Content
                      </a>
                    ) : (
                      sop.content
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="inline text-muted-foreground">
                  Required for positions:
                </dt>
                <dd className="inline ml-1">
                  {sop.positions?.length > 0
                    ? sop.positions
                        .filter((pos: any) => pos.isActive)
                        .map((pos: any) => pos.name)
                        .join(", ")
                    : "No positions"}
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="font-semibold mb-2">History</h3>
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="inline text-muted-foreground">Created by:</dt>
                <dd className="inline ml-1">{sop.createdBy.name}</dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">Created on:</dt>
                <dd className="inline ml-1">
                  {new Date(sop.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">
                  Last modified by:
                </dt>
                <dd className="inline ml-1">{sop.lastModifiedBy.name}</dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">
                  Last modified on:
                </dt>
                <dd className="inline ml-1">
                  {new Date(sop.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex items-center space-x-4">
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          <Button onClick={() => setIsDialogOpen(true)}>Create SOP</Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <Select
            value={filters.status || "ALL"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                status: value as "ALL" | "ACTIVE" | "INACTIVE",
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.role || "ALL"}
            onValueChange={(value) =>
              setFilters({ ...filters, role: value as Role | "ALL" })
            }
          >
            <SelectTrigger className="w-[180px]">
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

          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as "name" | "version" | "date")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Modified</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="version">Version</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <ListView
        data={sops}
        columns={columns}
        view={currentView}
        renderCard={renderCard}
        keyExtractor={(sop) => sop.id}
        emptyMessage="No SOPs found."
      />

      <SOPDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedSOP(undefined);
        }}
        onSubmit={selectedSOP ? handleUpdate : handleCreate}
        sop={selectedSOP}
        title={selectedSOP ? "Edit SOP" : "Create SOP"}
      />
    </div>
  );
}
