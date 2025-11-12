import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { Role, TrainingStatus } from "@prisma/client";
import { getTrainingStatusBgColor, getTrainingStatusText } from "@/lib/utils";

// Define types for our metrics
interface DepartmentTrainingStats {
  name: string;
  userCount: number;
  completedTrainings: number;
  totalTrainings: number;
  completionRate: number;
}

interface SiteMetrics {
  totalSiteSOPs: number;
  totalSiteUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingApprovals: number;
  recentTrainings: Array<any>; // Using any for simplicity, but could be more specific
  departmentTrainingStats: DepartmentTrainingStats[];
}

interface Metrics {
  user: any;
  assignedTrainings: any[];
  totalTrainings: number;
  completedTrainings: number;
  inProgressTrainings: number;
  signedTrainings: number;
  criticalTrainings: number;
  criticalCompleted: number;
  siteMetrics: SiteMetrics | null;
}

async function getMetrics(
  userId: string,
  userRole: Role,
  siteId: string
): Promise<Metrics> {
  // Common metrics for all users
  const [user, assignedTrainings] = await Promise.all([
    // Get user details
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        position: true,
      },
    }),
    // Get detailed training information
    prisma.trainingProgress.findMany({
      where: {
        userId: userId,
      },
      include: {
        sop: {
          select: {
            id: true,
            name: true,
            version: true,
            isCritical: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  // Calculate training statistics
  const totalTrainings = assignedTrainings.length;
  const completedTrainings = assignedTrainings.filter(
    (t) => t.status === "COMPLETED"
  ).length;
  const inProgressTrainings = assignedTrainings.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;
  const signedTrainings = assignedTrainings.filter((t) => t.isSigned).length;
  const criticalTrainings = assignedTrainings.filter(
    (t) => t.sop.isCritical
  ).length;
  const criticalCompleted = assignedTrainings.filter(
    (t) => t.sop.isCritical && (t.status === "COMPLETED" || t.isSigned)
  ).length;

  // Base metrics object
  const metrics: Metrics = {
    user,
    assignedTrainings,
    totalTrainings,
    completedTrainings,
    inProgressTrainings,
    signedTrainings,
    criticalTrainings,
    criticalCompleted,
    // Will be populated conditionally below
    siteMetrics: null,
  };

  // Additional metrics for site admins and above
  if (
    userRole === "SITE_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "OWNER"
  ) {
    const [
      totalSiteSOPs,
      totalSiteUsers,
      activeUsers,
      pendingApprovals,
      recentTrainings,
      departmentStats,
    ] = await Promise.all([
      // Total SOPs for the site
      prisma.sOP.count({
        where: {
          trainings: {
            some: {
              user: {
                siteId: siteId,
              },
            },
          },
        },
      }),
      // Total users for the site
      prisma.user.count({
        where: {
          siteId: siteId,
        },
      }),
      // Active users for the site
      prisma.user.count({
        where: {
          siteId: siteId,
          isActive: true,
        },
      }),
      // Pending approvals (users with PENDING role)
      prisma.user.count({
        where: {
          siteId: siteId,
          role: "PENDING",
        },
      }),
      // Recent training activities
      prisma.trainingProgress.findMany({
        where: {
          user: {
            siteId: siteId,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              department: {
                select: {
                  name: true,
                },
              },
            },
          },
          sop: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
      // Department training statistics
      prisma.department.findMany({
        where: {
          siteId: siteId,
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              trainings: {
                select: {
                  status: true,
                  isSigned: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Process department stats
    const departmentTrainingStats: DepartmentTrainingStats[] =
      departmentStats.map((dept) => {
        const deptUsers = dept.users.length;
        const deptTrainings = dept.users.flatMap((u) => u.trainings);
        const deptCompleted = deptTrainings.filter(
          (t) => t.status === "COMPLETED" || t.isSigned
        ).length;
        const deptTotal = deptTrainings.length;

        return {
          name: dept.name,
          userCount: deptUsers,
          completedTrainings: deptCompleted,
          totalTrainings: deptTotal,
          completionRate: deptTotal > 0 ? (deptCompleted / deptTotal) * 100 : 0,
        };
      });

    metrics.siteMetrics = {
      totalSiteSOPs,
      totalSiteUsers,
      activeUsers,
      inactiveUsers: totalSiteUsers - activeUsers,
      pendingApprovals,
      recentTrainings,
      departmentTrainingStats,
    };
  }

  return metrics;
}

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      site: true,
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  // Redirect PENDING users to the pending approval page
  if (user.role === "PENDING") {
    redirect("/auth/pending");
  }

  const metrics = await getMetrics(user.id, user.role, user.siteId);
  const isSiteAdmin =
    user.role === "SITE_ADMIN" ||
    user.role === "ADMIN" ||
    user.role === "OWNER";

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name} | {user.site.name}
          </p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-md">
          <p className="font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* User Training Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Training Progress</CardTitle>
            <CardDescription>Overall completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">
                {metrics.totalTrainings > 0
                  ? Math.round(
                      (metrics.completedTrainings / metrics.totalTrainings) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {metrics.completedTrainings} of {metrics.totalTrainings}{" "}
                completed
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{
                    width: `${
                      metrics.totalTrainings > 0
                        ? (metrics.completedTrainings /
                            metrics.totalTrainings) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Critical SOPs</CardTitle>
            <CardDescription>High priority training</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">
                {metrics.criticalTrainings > 0
                  ? Math.round(
                      (metrics.criticalCompleted / metrics.criticalTrainings) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {metrics.criticalCompleted} of {metrics.criticalTrainings}{" "}
                completed
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-red-500 h-2.5 rounded-full"
                  style={{
                    width: `${
                      metrics.criticalTrainings > 0
                        ? (metrics.criticalCompleted /
                            metrics.criticalTrainings) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Assigned SOPs</CardTitle>
            <CardDescription>Total training assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalTrainings}</div>
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <div>In Progress: {metrics.inProgressTrainings}</div>
              <div>Completed: {metrics.completedTrainings}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Signed Documents</CardTitle>
            <CardDescription>Completed with signature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.signedTrainings}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {metrics.totalTrainings > 0
                ? Math.round(
                    (metrics.signedTrainings / metrics.totalTrainings) * 100
                  )
                : 0}
              % of total trainings
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Site Admin Metrics */}
      {isSiteAdmin && metrics.siteMetrics && (
        <>
          <h2 className="text-2xl font-bold mt-10 mb-6">Site Overview</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total SOPs</CardTitle>
                <CardDescription>Site-wide standard procedures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.siteMetrics.totalSiteSOPs}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Users</CardTitle>
                <CardDescription>All registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.siteMetrics.totalSiteUsers}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <div>Active: {metrics.siteMetrics.activeUsers}</div>
                  <div>Inactive: {metrics.siteMetrics.inactiveUsers}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Currently active accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.siteMetrics.activeUsers}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {metrics.siteMetrics.totalSiteUsers > 0
                    ? Math.round(
                        (metrics.siteMetrics.activeUsers /
                          metrics.siteMetrics.totalSiteUsers) *
                          100
                      )
                    : 0}
                  % of total users
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Users awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {metrics.siteMetrics.pendingApprovals}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Training Stats */}
          <h2 className="text-2xl font-bold mt-10 mb-6">
            Department Training Status
          </h2>
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {metrics.siteMetrics.departmentTrainingStats.map((dept, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle>{dept.name}</CardTitle>
                  <CardDescription>{dept.userCount} users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-2">
                    <span>Completion Rate:</span>
                    <span className="font-medium">
                      {Math.round(dept.completionRate)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full"
                      style={{ width: `${dept.completionRate}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {dept.completedTrainings} of {dept.totalTrainings} trainings
                    completed
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Training Activity */}
          <h2 className="text-2xl font-bold mt-10 mb-6">
            Recent Training Activity
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Latest Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.siteMetrics.recentTrainings.map((training) => (
                  <div
                    key={training.id}
                    className="flex justify-between items-center border-b pb-3"
                  >
                    <div>
                      <p className="font-medium">{training.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {training.user.department?.name} • {training.sop.name}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getTrainingStatusBgColor(
                          training.status as TrainingStatus,
                          training.isSigned
                        )}`}
                      >
                        {getTrainingStatusText(
                          training.status as TrainingStatus,
                          training.isSigned
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground ml-3">
                        {new Date(training.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* User's Assigned Trainings */}
      <h2 className="text-2xl font-bold mt-10 mb-6">Your Assigned Trainings</h2>
      <Card>
        <CardHeader>
          <CardTitle>Training Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.assignedTrainings.length === 0 ? (
            <p className="text-muted-foreground">No trainings assigned yet.</p>
          ) : (
            <div className="space-y-4">
              {metrics.assignedTrainings.map((training) => (
                <div
                  key={training.id}
                  className="flex justify-between items-center border-b pb-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="font-medium">{training.sop.name}</p>
                      {training.sop.isCritical && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Version: {training.sop.version}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTrainingStatusBgColor(
                        training.status as TrainingStatus,
                        training.isSigned
                      )}`}
                    >
                      {getTrainingStatusText(
                        training.status as TrainingStatus,
                        training.isSigned
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground ml-3">
                      {new Date(training.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
