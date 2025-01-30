"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Role, SOP } from "@prisma/client";
import { SOPDialog } from "@/components/sop-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SOPWithRelations = SOP & {
  createdBy: {
    name: string;
    email: string;
  };
  lastModifiedBy: {
    name: string;
    email: string;
  };
};

const rolesList = Object.values(Role);

function formatRole(role: Role) {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export default function SOPsPage() {
  const [sops, setSOPs] = useState<SOPWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSOP, setSelectedSOP] = useState<
    SOPWithRelations | undefined
  >();
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "version" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sops");
        const data = await response.json();
        setSOPs(data);
      } catch (error) {
        console.error("Failed to fetch SOPs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateSOP = async (data: any) => {
    try {
      const response = await fetch("/api/sops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create SOP");
      }

      const newSOP = await response.json();
      setSOPs((prev) => [...prev, newSOP]);
      setIsDialogOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateSOP = async (data: any) => {
    try {
      const response = await fetch("/api/sops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update SOP");
      }

      const updatedSOP = await response.json();
      setSOPs((prev) =>
        prev.map((sop) => (sop.id === updatedSOP.id ? updatedSOP : sop))
      );
      setIsDialogOpen(false);
      setSelectedSOP(undefined);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteSOP = async (sopId: string) => {
    if (!confirm("Are you sure you want to deactivate this SOP?")) return;

    try {
      const response = await fetch(`/api/sops?id=${sopId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete SOP");
      }

      setSOPs((prev) => prev.filter((sop) => sop.id !== sopId));
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Standard Operating Procedures</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Create SOP</Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "ALL" | "ACTIVE" | "INACTIVE")
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
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as Role | "ALL")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {rolesList.map((role) => (
                <SelectItem key={role} value={role}>
                  {formatRole(role)}
                </SelectItem>
              ))
    
              }
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

      <div className="grid gap-6">
        {sops
          .filter((sop) => {
            if (statusFilter === "ALL") return true;
            return statusFilter === "ACTIVE" ? sop.isActive : !sop.isActive;
          })
          .filter((sop) => {
            if (roleFilter === "ALL") return true;
            return sop.requiredRoles.includes(roleFilter);
          })
          .sort((a, b) => {
            switch (sortBy) {
              case "name":
                return sortOrder === "asc"
                  ? a.name.localeCompare(b.name)
                  : b.name.localeCompare(a.name);
              case "version":
                return sortOrder === "asc"
                  ? a.version.localeCompare(b.version)
                  : b.version.localeCompare(a.version);
              case "date":
                const dateA = new Date(a.updatedAt).getTime();
                const dateB = new Date(b.updatedAt).getTime();
                return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
              default:
                return 0;
            }
          })
          .map((sop) => (
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
                        onClick={() => handleDeleteSOP(sop.id)}
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
                          <dt className="inline text-muted-foreground">
                            Description:
                          </dt>
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
                          <dt className="inline text-muted-foreground">
                            Content:
                          </dt>
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
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">History</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">
                          Created by:
                        </dt>
                        <dd className="inline ml-1">{sop.createdBy.name}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Created on:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(sop.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Last modified by:
                        </dt>
                        <dd className="inline ml-1">
                          {sop.lastModifiedBy.name}
                        </dd>
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
          ))}
      </div>

      <SOPDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedSOP(undefined);
        }}
        onSubmit={selectedSOP ? handleUpdateSOP : handleCreateSOP}
        sop={selectedSOP}
        title={selectedSOP ? "Edit SOP" : "Create SOP"}
      />
    </div>
  );
}
