"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Role, SOP } from "@prisma/client";
import { SOPDialog } from "@/components/sop-dialog";

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

      setIsDialogOpen(false);
      window.location.reload();
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

      setIsDialogOpen(false);
      setSelectedSOP(undefined);
      window.location.reload();
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

      window.location.reload();
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

      <div className="grid gap-6">
        {sops.map((sop) => (
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
