"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Site } from "@prisma/client";
import { SiteDialog } from "@/components/features/sites/site-dialog";

type SiteWithStats = Site & {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalDocuments: number;
    totalSOPs: number;
    completedTrainings: number;
  };
};

export default function SitesPage() {
  const [sites, setSites] = useState<SiteWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteWithStats | undefined>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/sites");
        const data = await response.json();
        setSites(data);
      } catch (error) {
        console.error("Failed to fetch sites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateSite = async (data: any) => {
    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create site");
      }

      const newSite = await response.json();
      setSites((prev) => [...prev, newSite]);
      setIsDialogOpen(false);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateSite = async (data: any) => {
    try {
      const response = await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update site");
      }

      const updatedSite = await response.json();
      setSites((prev) =>
        prev.map((site) => (site.id === updatedSite.id ? updatedSite : site))
      );
      setIsDialogOpen(false);
      setSelectedSite(undefined);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm("Are you sure you want to deactivate this site?")) return;

    try {
      const response = await fetch(`/api/sites?id=${siteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete site");
      }

      setSites((prev) => prev.filter((site) => site.id !== siteId));
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
        <h1 className="text-3xl font-bold">Sites</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Create Site</Button>
      </div>

      <div className="grid gap-6">
        {Array.isArray(sites) && sites.length > 0 ? (
          sites.map((site) => (
            <Card key={site.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{site.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {site.code}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        site.isActive
                          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                          : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                      }`}
                    >
                      {site.isActive ? "Active" : "Inactive"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSite(site);
                        setIsDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/admin/sites/${site.id}`;
                      }}
                    >
                      Details
                    </Button>
                    {site.isActive && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSite(site.id)}
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
                      {site.description && (
                        <div>
                          <dt className="inline text-muted-foreground">
                            Description:
                          </dt>
                          <dd className="inline ml-1">{site.description}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="inline text-muted-foreground">Users:</dt>
                        <dd className="inline ml-1">
                          {site.stats.activeUsers} active /{" "}
                          {site.stats.totalUsers} total
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Documents:
                        </dt>
                        <dd className="inline ml-1">
                          {site.stats.totalDocuments}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">SOPs:</dt>
                        <dd className="inline ml-1">{site.stats.totalSOPs}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Completed Trainings:
                        </dt>
                        <dd className="inline ml-1">
                          {site.stats.completedTrainings}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Created on:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(site.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Last updated:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(site.updatedAt).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No sites found
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <SiteDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedSite(undefined);
        }}
        onSubmit={selectedSite ? handleUpdateSite : handleCreateSite}
        site={selectedSite}
        title={selectedSite ? "Edit Site" : "Create Site"}
      />
    </div>
  );
}
