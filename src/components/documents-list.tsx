import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentType, Document, SOP } from "@prisma/client";
import { DocumentDialog } from "@/components/document-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocuments } from "@/hooks/useDocuments";
import { useEffect } from "react";

interface DocumentsListProps {
  siteId?: string;
  title?: string;
  sops?: SOP[];
}

function formatDocumentType(type: DocumentType) {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function DocumentsList({
  siteId,
  title = "Documents",
  sops = [],
}: DocumentsListProps) {
  const {
    documents,
    isLoading,
    isDialogOpen,
    selectedDocument,
    filters,
    sortBy,
    sortOrder,
    setIsDialogOpen,
    setSelectedDocument,
    setFilters,
    setSortBy,
    setSortOrder,
    fetchDocuments,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDownloadDocument,
  } = useDocuments({ siteId, sops });

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Upload Document</Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <Select
            value={filters.type || "ALL"}
            onValueChange={(value) =>
              setFilters({ ...filters, type: value as DocumentType | "ALL" })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="SOP_ATTACHMENT">SOP Attachment</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sop || "ALL"}
            onValueChange={(value) => setFilters({ ...filters, sop: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by SOP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All SOPs</SelectItem>
              <SelectItem value="NONE">No SOP</SelectItem>
              {sops.map((sop) => (
                <SelectItem key={sop.id} value={sop.id}>
                  {sop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.metadata || "ALL"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                metadata: value as "ALL" | "WITH" | "WITHOUT",
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by metadata" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Documents</SelectItem>
              <SelectItem value="WITH">With Metadata</SelectItem>
              <SelectItem value="WITHOUT">Without Metadata</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as "name" | "date" | "uploader")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Upload Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="uploader">Uploader</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {documents.map((document) => (
          <Card key={document.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{document.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDocumentType(document.type)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownloadDocument(document.id, document.name)
                    }
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDocument(document);
                      setIsDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(document.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <dl className="space-y-1 text-sm">
                    <div>
                      <dt className="inline text-muted-foreground">
                        Uploaded by:
                      </dt>
                      <dd className="inline ml-1">
                        {document.uploadedBy.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-muted-foreground">
                        Upload date:
                      </dt>
                      <dd className="inline ml-1">
                        {new Date(document.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Related SOP</h3>
                  {document.sop ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {document.sop.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          v{document.sop.version}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedDocument(document);
                            setIsDialogOpen(true);
                          }}
                        >
                          Change SOP
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        No SOP associated
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedDocument(document);
                          setIsDialogOpen(true);
                        }}
                      >
                        Link to SOP
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Metadata</h3>
                  {document.metadata &&
                  Object.keys(document.metadata).length > 0 ? (
                    <dl className="space-y-1 text-sm">
                      {Object.entries(document.metadata).map(([key, value]) => (
                        <div key={key}>
                          <dt className="inline text-muted-foreground">
                            {key}:
                          </dt>
                          <dd className="inline ml-1">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No metadata available
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No documents found.
          </p>
        )}
      </div>

      <DocumentDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedDocument(undefined);
        }}
        onSubmit={selectedDocument ? handleUpdate : handleCreate}
        sops={sops}
        document={selectedDocument}
        title={selectedDocument ? "Edit Document" : "Upload Document"}
      />
    </div>
  );
}
