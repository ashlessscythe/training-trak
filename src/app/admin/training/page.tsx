"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingWithRelations } from "@/hooks/useTraining";
import { TrainingStatus } from "@prisma/client";
import { AdminTrainingDetails } from "@/components/features/trainings/admin-training-details";
import { getTrainingStatusColor, getTrainingStatusText } from "@/lib/utils";

export default function AdminTrainingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;
  const [isLoading, setIsLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  const [trainingData, setTrainingData] = useState<
    Record<string, TrainingWithRelations[]>
  >({});
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && !["OWNER", "ADMIN"].includes(userRole as string)) {
      router.push("/dashboard");
    }
  }, [status, userRole, router]);

  // Fetch all sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch("/api/sites");
        if (!response.ok) throw new Error("Failed to fetch sites");
        const data = await response.json();
        setSites(data);
      } catch (error) {
        console.error("Error fetching sites:", error);
      }
    };

    if (status === "authenticated" && ["OWNER", "ADMIN"].includes(userRole as string)) {
      fetchSites();
    }
  }, [status, userRole]);

  // Fetch all trainings
  useEffect(() => {
    const fetchAllTrainings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/trainings");
        if (!response.ok) throw new Error("Failed to fetch trainings");
        const data = await response.json();

        // Group trainings by site
        const bySite: Record<string, TrainingWithRelations[]> = {};

        data.forEach((training: TrainingWithRelations) => {
          const siteId = training.user.siteId;
          if (!bySite[siteId]) {
            bySite[siteId] = [];
          }
          bySite[siteId].push(training);
        });

        setTrainingData(bySite);
      } catch (error) {
        console.error("Error fetching trainings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sites.length > 0) {
      fetchAllTrainings();
    }
  }, [sites]);

  if (status === "loading") {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session || !["OWNER", "ADMIN"].includes(userRole as string)) {
    return null;
  }

  // Calculate statistics for each site
  const getSiteStats = (siteId: string) => {
    const trainings = trainingData[siteId] || [];
    const total = trainings.length;

    const counts = {
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };

    trainings.forEach((training) => {
      counts[training.status as keyof typeof counts]++;
    });

    return {
      total,
      ...counts,
      percentComplete: total ? Math.round((counts.COMPLETED / total) * 100) : 0,
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Training Status</h1>
        <p>Loading training data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Training Status Overview</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {sites.map((site) => {
          const stats = getSiteStats(site.id);
          return (
            <Card
              key={site.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                selectedSite === site.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() =>
                setSelectedSite(selectedSite === site.id ? null : site.id)
              }
            >
              <CardHeader className="pb-2">
                <CardTitle>{site.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Site Code: {site.code}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Total Trainings:</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>In Progress:</span>
                    <span
                      className={`font-medium ${getTrainingStatusColor(
                        "IN_PROGRESS"
                      )}`}
                    >
                      {stats.IN_PROGRESS}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Completed:</span>
                    <span
                      className={`font-medium ${getTrainingStatusColor(
                        "COMPLETED"
                      )}`}
                    >
                      {stats.COMPLETED}
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span>Completion Rate:</span>
                      <span className="font-bold">
                        {stats.percentComplete}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${stats.percentComplete}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sites.length === 0 && (
        <div className="text-center p-8">
          <p className="text-xl">No sites found. Please create sites first.</p>
        </div>
      )}

      {sites.length > 0 && Object.keys(trainingData).length === 0 && (
        <div className="text-center p-8">
          <p className="text-xl">No training data found across any sites.</p>
        </div>
      )}

      {selectedSite && (
        <div className="mt-8 border-t pt-6">
          <AdminTrainingDetails
            site={sites.find((site) => site.id === selectedSite)}
            trainings={trainingData[selectedSite] || []}
          />
        </div>
      )}
    </div>
  );
}
