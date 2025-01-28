import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";

async function getSOPs(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return prisma.sOP.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      documents: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      trainings: {
        where: {
          userId: userId,
        },
        select: {
          status: true,
          completedAt: true,
          approvedAt: true,
        },
      },
      createdBy: {
        select: {
          name: true,
        },
      },
      lastModifiedBy: {
        select: {
          name: true,
        },
      },
    },
  });
}

export default async function SOPsPage() {
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

  const sops = await getSOPs(user.id);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Standard Operating Procedures</h1>
      </div>

      <div className="grid gap-6">
        {sops.map((sop) => {
          const training = sop.trainings[0];
          const status = training?.status || "NOT_STARTED";

          return (
            <Card key={sop.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{sop.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Version {sop.version}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        status === "APPROVED"
                          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                          : status === "COMPLETED"
                          ? "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20"
                          : "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20"
                      }`}
                    >
                      {status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sop.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {sop.description}
                  </p>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Documents</h3>
                    <ul className="space-y-1">
                      {sop.documents.map((doc) => (
                        <li key={doc.id} className="text-sm">
                          {doc.name} ({doc.type.replace("_", " ")})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Details</h3>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">
                          Created by:
                        </dt>
                        <dd className="inline ml-1">{sop.createdBy.name}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Last modified by:
                        </dt>
                        <dd className="inline ml-1">
                          {sop.lastModifiedBy.name}
                        </dd>
                      </div>
                      {training?.completedAt && (
                        <div>
                          <dt className="inline text-muted-foreground">
                            Completed:
                          </dt>
                          <dd className="inline ml-1">
                            {new Date(
                              training.completedAt
                            ).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                      {training?.approvedAt && (
                        <div>
                          <dt className="inline text-muted-foreground">
                            Approved:
                          </dt>
                          <dd className="inline ml-1">
                            {new Date(training.approvedAt).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
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
