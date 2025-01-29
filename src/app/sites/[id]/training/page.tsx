import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { TrainingProgress, TrainingStatus } from "@prisma/client";

export default async function SiteTrainingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  // Only allow access if user belongs to this site
  // Allow OWNER/ADMIN to access any site, but restrict others to their own site
  if (
    !["OWNER", "ADMIN"].includes(session.user.role) &&
    session.user.site?.id !== params.id
  ) {
    redirect("/dashboard");
  }

  const trainings = await prisma.trainingProgress.findMany({
    where: {
      OR: [
        {
          user: {
            siteId: params.id,
          },
        },
        {
          sop: {
            createdBy: {
              siteId: params.id,
            },
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      sop: {
        select: {
          name: true,
          version: true,
        },
      },
      approvedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const site = await prisma.site.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!site) {
    redirect("/dashboard");
  }

  // Helper function to get status badge color
  const getStatusColor = (status: TrainingStatus) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600";
      case "REJECTED":
        return "text-red-600";
      case "COMPLETED":
        return "text-blue-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">
        Training Progress - {site.name}
      </h1>
      <div className="grid gap-4">
        {trainings.map(
          (
            training: TrainingProgress & {
              user: { name: string };
              sop: { name: string; version: string };
              approvedBy: { name: string } | null;
            }
          ) => (
            <Card key={training.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {training.sop.name} v{training.sop.version}
                </h3>
                <span
                  className={`font-medium ${getStatusColor(training.status)}`}
                >
                  {training.status.replace("_", " ")}
                </span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Trainee: {training.user.name}</p>
                {training.completedAt && (
                  <p>
                    Completed:{" "}
                    {new Date(training.completedAt).toLocaleDateString()}
                  </p>
                )}
                {training.approvedBy && (
                  <p>
                    Approved by: {training.approvedBy.name} on{" "}
                    {new Date(training.approvedAt!).toLocaleDateString()}
                  </p>
                )}
                {training.notes && <p>Notes: {training.notes}</p>}
              </div>
            </Card>
          )
        )}
        {trainings.length === 0 && (
          <p className="text-muted-foreground">
            No training records found for this site.
          </p>
        )}
      </div>
    </div>
  );
}
