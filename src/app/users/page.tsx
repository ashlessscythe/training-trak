import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

async function getUsers() {
  return prisma.user.findMany({
    include: {
      site: true,
      trainings: {
        select: {
          status: true,
        },
      },
      uploadedDocs: {
        select: {
          id: true,
        },
      },
      createdSOPs: {
        select: {
          id: true,
        },
      },
    },
    orderBy: [
      {
        site: {
          name: "asc",
        },
      },
      {
        role: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
}

function formatRole(role: Role) {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function getUserStats(user: Awaited<ReturnType<typeof getUsers>>[0]) {
  const totalTrainings = user.trainings.length;
  const completedTrainings = user.trainings.filter(
    (t) => t.status === "APPROVED"
  ).length;
  const uploadedDocs = user.uploadedDocs.length;
  const createdSOPs = user.createdSOPs.length;

  return {
    totalTrainings,
    completedTrainings,
    trainingProgress: totalTrainings
      ? Math.round((completedTrainings / totalTrainings) * 100)
      : 0,
    uploadedDocs,
    createdSOPs,
  };
}

export default async function UsersPage() {
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

  const users = await getUsers();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
      </div>

      <div className="grid gap-6">
        {users.map((user) => {
          const stats = getUserStats(user);

          return (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                          : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Details</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">Site:</dt>
                        <dd className="inline ml-1">{user.site.name}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">Role:</dt>
                        <dd className="inline ml-1">{formatRole(user.role)}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Member since:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Activity</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">
                          Training progress:
                        </dt>
                        <dd className="inline ml-1">
                          {stats.completedTrainings} / {stats.totalTrainings} (
                          {stats.trainingProgress}%)
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Documents uploaded:
                        </dt>
                        <dd className="inline ml-1">{stats.uploadedDocs}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          SOPs created:
                        </dt>
                        <dd className="inline ml-1">{stats.createdSOPs}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
