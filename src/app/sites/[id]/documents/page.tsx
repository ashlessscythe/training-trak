import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Document } from "@prisma/client";

export default async function SiteDocumentsPage({
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

  const documents = await prisma.document.findMany({
    where: {
      uploadedBy: {
        siteId: params.id,
      },
      type: "OTHER", // Only show general documents, not SOP or training specific ones
      OR: [
        {
          sop: null, // Documents not associated with any SOP
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
      uploadedBy: {
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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Documents - {site.name}</h1>
      <div className="grid gap-4">
        {documents.map((doc: Document & { uploadedBy: { name: string } }) => (
          <Card key={doc.id} className="p-4">
            <h3 className="text-lg font-semibold mb-2">{doc.name}</h3>
            {doc.metadata && (
              <p className="text-sm text-muted-foreground mb-4">
                {JSON.stringify(doc.metadata)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Uploaded by {doc.uploadedBy.name}
              </span>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                View Document
              </a>
            </div>
          </Card>
        ))}
        {documents.length === 0 && (
          <p className="text-muted-foreground">
            No documents found for this site.
          </p>
        )}
      </div>
    </div>
  );
}
