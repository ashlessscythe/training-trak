"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Site } from "@prisma/client";

interface SiteFormProps {
  onSubmit: (data: {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
    id?: string;
  }) => Promise<void>;
  initialData?: {
    id: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
  };
  onCancel: () => void;
}

export function SiteForm({ onSubmit, initialData, onCancel }: SiteFormProps) {
  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    isActive: initialData?.isActive ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        id: initialData?.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Site Code</label>
        <input
          type="text"
          required
          value={formData.code}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, code: e.target.value }))
          }
          className="w-full p-2 border rounded-md"
          placeholder="e.g., NYC-01"
        />
      </div>

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
          placeholder="e.g., New York City Office"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full p-2 border rounded-md h-24"
          placeholder="Brief description of the site"
        />
      </div>

      {initialData && (
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
      )}

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
            ? "Update Site"
            : "Create Site"}
        </Button>
      </div>
    </form>
  );
}
