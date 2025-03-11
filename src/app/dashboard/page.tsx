import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";

async function getMetrics(userId: string) {
  const [assignedSops, trainingProgress, pendingTrainings, recentDocuments] =
    await Promise.all([
      // Get assigned SOPs count
      prisma.sOP.count({
        where: {
          trainings: {
            some: {
              userId: userId,
            },
          },
        },
      }),
      // Get training progress
      prisma.trainingProgress.findMany({
        where: {
          userId: userId,
        },
        select: {
          status: true,
        },
      }),
      // Get pending trainings (for supervisors/admins)
      prisma.trainingProgress.count({
        where: {
          status: "IN_PROGRESS",
        },
      }),
      // Get recent documents
      prisma.document.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          uploadedBy: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

  const completedTrainings = trainingProgress.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  return {
    assignedSops,
    completedTrainings,
    totalTrainings: trainingProgress.length,
    pendingTrainings,
    recentDocuments,
  };
}

export default async function DashboardPage() {
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

  const metrics = await getMetrics(user.id);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Assigned SOPs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.assignedSops}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {metrics.completedTrainings} / {metrics.totalTrainings}
            </p>
            <p className="text-sm text-muted-foreground">
              {metrics.totalTrainings
                ? (
                    ((metrics.completedTrainings ?? 0) /
                      metrics.totalTrainings) *
                    100
                  ).toFixed(1) + "%"
                : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.pendingTrainings}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentDocuments.map((doc) => (
                <div key={doc.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Uploaded by {doc.uploadedBy.name}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
