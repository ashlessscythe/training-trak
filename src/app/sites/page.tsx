import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

async function getSites() {
  return prisma.site.findMany({
    include: {
      users: {
        select: {
          id: true,
          role: true,
          trainings: {
            select: {
              status: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

function getSiteStats(site: Awaited<ReturnType<typeof getSites>>[0]) {
  const usersByRole = site.users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<Role, number>);

  const trainingStats = site.users.reduce(
    (acc, user) => {
      const userTrainings = user.trainings.length;
      const completedTrainings = user.trainings.filter(
        (t) => t.status === "APPROVED"
      ).length;

      acc.totalTrainings += userTrainings;
      acc.completedTrainings += completedTrainings;

      return acc;
    },
    { totalTrainings: 0, completedTrainings: 0 }
  );

  return {
    totalUsers: site.users.length,
    usersByRole,
    trainingStats,
    complianceRate: trainingStats.totalTrainings
      ? Math.round(
          (trainingStats.completedTrainings / trainingStats.totalTrainings) *
            100
        )
      : 0,
  };
}

export default async function SitesPage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  const sites = await getSites();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sites</h1>
      </div>

      <div className="grid gap-6">
        {sites.map((site) => {
          const stats = getSiteStats(site);

          return (
            <Card key={site.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{site.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Code: {site.code}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        site.isActive
                          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                          : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                      }`}
                    >
                      {site.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {site.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {site.description}
                  </p>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">User Distribution</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">
                          Total Users:
                        </dt>
                        <dd className="inline ml-1">{stats.totalUsers}</dd>
                      </div>
                      {Object.entries(stats.usersByRole)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([role, count]) => (
                          <div key={role}>
                            <dt className="inline text-muted-foreground">
                              {role.charAt(0) + role.slice(1).toLowerCase()}:
                            </dt>
                            <dd className="inline ml-1">{count}</dd>
                          </div>
                        ))}
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Training Compliance</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">
                          Progress:
                        </dt>
                        <dd className="inline ml-1">
                          {stats.trainingStats.completedTrainings} /{" "}
                          {stats.trainingStats.totalTrainings} (
                          {stats.complianceRate}%)
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    Created: {new Date(site.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    Last updated:{" "}
                    {new Date(site.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
