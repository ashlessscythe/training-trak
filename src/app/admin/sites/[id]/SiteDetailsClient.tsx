"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Site, User } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";

type SiteAdmin = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
};

export default function SiteDetailsClient() {
  const params = useParams();
  const id = params.id as string;
  const [site, setSite] = useState<Site | null>(null);
  const [siteAdmins, setSiteAdmins] = useState<SiteAdmin[]>([]);
  const [availableSiteAdmins, setAvailableSiteAdmins] = useState<User[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch site details
        const siteResponse = await fetch(`/api/sites/${id}`);
        const siteData = await siteResponse.json();
        setSite(siteData);

        // Fetch site admins
        const adminsResponse = await fetch(`/api/sites/${id}/admins`);
        const adminsData = await adminsResponse.json();
        setSiteAdmins(adminsData);

        // Fetch all site admins
        const allAdminsResponse = await fetch("/api/users?role=SITE_ADMIN");
        const allAdminsData = await allAdminsResponse.json();
        setAvailableSiteAdmins(allAdminsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAssignAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const response = await fetch(`/api/sites/${id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedAdmin }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to assign admin");
      }

      const newAdmin = await response.json();
      setSiteAdmins((prev) => [...prev, newAdmin]);
      setSelectedAdmin("");
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin from the site?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/sites/${id}/admins?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove admin");
      }

      setSiteAdmins((prev) =>
        prev.filter((admin) => admin.user.id !== userId)
      );
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

  if (!site) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Site not found</div>
      </div>
    );
  }

  // Filter out admins that are already assigned to this site
  const unassignedAdmins = availableSiteAdmins.filter(
    (admin) =>
      !siteAdmins.some((siteAdmin) => siteAdmin.user.id === admin.id)
  );

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{site.name}</h1>
          <p className="text-muted-foreground">Site Code: {site.code}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Site Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Select
                  value={selectedAdmin}
                  onValueChange={setSelectedAdmin}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a site admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedAdmins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssignAdmin}
                  disabled={!selectedAdmin}
                >
                  Assign Admin
                </Button>
              </div>

              <div className="space-y-2">
                {siteAdmins.map((siteAdmin) => (
                  <div
                    key={siteAdmin.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{siteAdmin.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {siteAdmin.user.email}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAdmin(siteAdmin.user.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                {siteAdmins.length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No site admins assigned
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 