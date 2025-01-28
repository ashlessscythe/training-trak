import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { DocumentType } from "@prisma/client";

async function getDocuments() {
  return prisma.document.findMany({
    orderBy: [
      {
        type: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: {
      uploadedBy: {
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
    },
  });
}

function groupDocumentsByType(
  documents: Awaited<ReturnType<typeof getDocuments>>
) {
  return documents.reduce((groups, doc) => {
    const type = doc.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(doc);
    return groups;
  }, {} as Record<DocumentType, typeof documents>);
}

function formatDocumentType(type: DocumentType) {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export default async function DocumentsPage() {
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

  const documents = await getDocuments();
  const groupedDocuments = groupDocumentsByType(documents);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Documents</h1>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedDocuments).map(([type, docs]) => (
          <div key={type}>
            <h2 className="text-xl font-semibold mb-4">
              {formatDocumentType(type as DocumentType)}
            </h2>
            <div className="grid gap-4">
              {docs.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{doc.name}</CardTitle>
                        {doc.sop && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Related to SOP: {doc.sop.name} (v{doc.sop.version})
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="inline text-muted-foreground">
                          Uploaded by:
                        </dt>
                        <dd className="inline ml-1">{doc.uploadedBy.name}</dd>
                      </div>
                      <div>
                        <dt className="inline text-muted-foreground">
                          Upload date:
                        </dt>
                        <dd className="inline ml-1">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                      {doc.metadata && (
                        <div>
                          <dt className="inline text-muted-foreground">
                            Additional info:
                          </dt>
                          <dd className="inline ml-1">
                            {Object.entries(
                              doc.metadata as Record<string, string>
                            )
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(", ")}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
