"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
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
  documents: { url: string }[];
  createdBy: {
    name: string;
    siteId: string;
  };
  lastModifiedBy: {
    name: string;
    siteId: string;
  };
};

const rolesList = Object.values(Role)

export default function SiteSopsPage() {
  const params = useParams();
  const siteId = params.id as string;

  const [sops, setSops] = useState<SOPWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSOP, setSelectedSOP] = useState<SOP | undefined>();
  const [siteName, setSiteName] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "version" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sopsRes, siteRes] = await Promise.all([
          fetch("/api/sops").then((res) => res.json()),
          fetch(`/api/sites/${siteId}`).then((res) => res.json()),
        ]);

        // Filter SOPs for this site
        const siteSops = sopsRes.filter(
          (sop: SOPWithRelations) =>
            sop.createdBy.siteId === siteId ||
            sop.lastModifiedBy.siteId === siteId
        );

        setSops(siteSops);
        setSiteName(siteRes.name);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

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
      setSops((prev) => [...prev, newSOP]);
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
      setSops((prev) =>
        prev.map((sop) => (sop.id === updatedSOP.id ? updatedSOP : sop))
      );
      setIsDialogOpen(false);
      setSelectedSOP(undefined);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteSOP = async (sopId: string) => {
    if (!confirm("Are you sure you want to delete this SOP?")) return;

    try {
      const response = await fetch(`/api/sops?id=${sopId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete SOP");
      }

      setSops((prev) => prev.filter((sop) => sop.id !== sopId));
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">SOPs - {siteName}</h1>
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
                  {role.replace("_", " ")} {/* Optional: Format display text */}
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

      <div className="grid gap-4">
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
            <Card key={sop.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {sop.name} v{sop.version}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {sop.description || "No description provided"}
                  </p>
                  {sop.content && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {sop.content}
                    </p>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <p>Created by {sop.createdBy.name}</p>
                    <p>Last modified by {sop.lastModifiedBy.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSOP(sop.id)}
                  >
                    Delete
                  </Button>
                  {sop.documents?.length > 0 && (
                    <a
                      href={sop.documents[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                    >
                      View Document
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        {sops.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No SOPs found for this site.
          </p>
        )}
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
