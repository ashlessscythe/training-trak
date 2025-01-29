import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { SOP } from "@prisma/client";

export default async function SiteSopsPage({
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

  const sops = await prisma.sOP.findMany({
    where: {
      OR: [
        {
          createdBy: {
            siteId: params.id,
          },
        },
        {
          lastModifiedBy: {
            siteId: params.id,
          },
        },
      ],
    },
    include: {
      documents: {
        where: {
          type: "SOP_DOCUMENT",
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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">SOPs - {site.name}</h1>
      <div className="grid gap-4">
        {sops.map((sop: SOP & { documents: { url: string }[] }) => (
          <Card key={sop.id} className="p-4">
            <h3 className="text-lg font-semibold mb-2">
              {sop.name} v{sop.version}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {sop.description || "No description provided"}
            </p>
            {sop.content && (
              <p className="text-sm text-muted-foreground mb-2">
                {sop.content}
              </p>
            )}
            {sop.documents.length > 0 && (
              <a
                href={sop.documents[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View Document
              </a>
            )}
          </Card>
        ))}
        {sops.length === 0 && (
          <p className="text-muted-foreground">No SOPs found for this site.</p>
        )}
      </div>
    </div>
  );
}
