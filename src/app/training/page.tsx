import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { TrainingStatus } from "@prisma/client";

async function getTrainingData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Get all training progress for the user
  const trainings = await prisma.trainingProgress.findMany({
    where: {
      OR: [
        { userId }, // Their own trainings
        ...(["ADMIN", "SUPERVISOR"].includes(user?.role || "")
          ? [{ status: TrainingStatus.COMPLETED, approvedById: null }] // Pending approvals for admins/supervisors
          : []),
      ],
    },
    include: {
      sop: true,
      user: true,
      approvedBy: true,
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });

  return {
    trainings,
    canApprove: ["ADMIN", "SUPERVISOR"].includes(user?.role || ""),
  };
}

export default async function TrainingPage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  const { trainings, canApprove } = await getTrainingData(user.id);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Training Progress</h1>
      </div>

      <div className="grid gap-6">
        {trainings.map((training) => (
          <Card key={training.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{training.sop.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Version {training.sop.version}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      training.status === TrainingStatus.APPROVED
                        ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                        : training.status === TrainingStatus.COMPLETED
                        ? "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20"
                        : training.status === TrainingStatus.REJECTED
                        ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                        : "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20"
                    }`}
                  >
                    {training.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {training.sop.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {training.sop.description}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <dl className="space-y-1 text-sm">
                    <div>
                      <dt className="inline text-muted-foreground">Trainee:</dt>
                      <dd className="inline ml-1">{training.user.name}</dd>
                    </div>
                    {training.completedAt && (
                      <div>
                        <dt className="inline text-muted-foreground">
                          Completed:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(training.completedAt).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {training.approvedBy && (
                      <div>
                        <dt className="inline text-muted-foreground">
                          Approved by:
                        </dt>
                        <dd className="inline ml-1">
                          {training.approvedBy.name}
                        </dd>
                      </div>
                    )}
                    {training.approvedAt && (
                      <div>
                        <dt className="inline text-muted-foreground">
                          Approved on:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(training.approvedAt).toLocaleDateString()}
                        </dd>
                      </div>
                    )}
                    {training.notes && (
                      <div>
                        <dt className="inline text-muted-foreground">Notes:</dt>
                        <dd className="inline ml-1">{training.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Action buttons will be added here in a future update */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
