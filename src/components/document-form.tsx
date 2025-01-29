"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentType, SOP } from "@prisma/client";

interface DocumentFormProps {
  sops: SOP[];
  onSubmit: (data: {
    name: string;
    type: DocumentType;
    url: string;
    metadata?: any;
    sopId?: string;
    id?: string;
  }) => Promise<void>;
  initialData?: {
    id: string;
    name: string;
    type: DocumentType;
    url: string;
    metadata?: any;
    sopId?: string;
  };
  onCancel: () => void;
}

export function DocumentForm({
  sops,
  onSubmit,
  initialData,
  onCancel,
}: DocumentFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type: initialData?.type || DocumentType.OTHER,
    url: initialData?.url || "",
    metadata: initialData?.metadata || {
      description: "",
      category: "",
      tags: [],
      version: "1.0",
    },
    sopId: initialData?.sopId || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        id: initialData?.id,
        sopId: formData.sopId || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          required
          value={formData.type}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              type: e.target.value as DocumentType,
            }))
          }
          className="w-full p-2 border rounded-md"
        >
          {Object.values(DocumentType).map((type) => (
            <option key={type} value={type}>
              {type
                .split("_")
                .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                .join(" ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">URL</label>
        <input
          type="url"
          required
          value={formData.url}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, url: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
          placeholder="https://"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Associated SOP (optional)
        </label>
        <select
          value={formData.sopId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, sopId: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
        >
          <option value="">None</option>
          {sops.map((sop) => (
            <option key={sop.id} value={sop.id}>
              {sop.name} (v{sop.version})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.metadata.description}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              metadata: { ...prev.metadata, description: e.target.value },
            }))
          }
          className="w-full p-2 border rounded-md"
          rows={3}
          placeholder="Enter document description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <input
          type="text"
          value={formData.metadata.category}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              metadata: { ...prev.metadata, category: e.target.value },
            }))
          }
          className="w-full p-2 border rounded-md"
          placeholder="Enter document category"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={formData.metadata.tags.join(", ")}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              metadata: {
                ...prev.metadata,
                tags: e.target.value.split(",").map((tag) => tag.trim()),
              },
            }))
          }
          className="w-full p-2 border rounded-md"
          placeholder="Enter tags, separated by commas"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Version</label>
        <input
          type="text"
          value={formData.metadata.version}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              metadata: { ...prev.metadata, version: e.target.value },
            }))
          }
          className="w-full p-2 border rounded-md"
          placeholder="e.g., 1.0"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : initialData
            ? "Update Document"
            : "Upload Document"}
        </Button>
      </div>
    </form>
  );
}
