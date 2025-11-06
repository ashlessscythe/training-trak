import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Position, SOP } from "@prisma/client";

interface PositionFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  position?: Position & { sops?: SOP[] };
  availableSops?: SOP[];
}

export function PositionForm({
  onSubmit,
  onCancel,
  position,
  availableSops = [],
}: PositionFormProps) {
  const [name, setName] = useState(position?.name || "");
  const [description, setDescription] = useState(position?.description || "");
  const [selectedSopIds, setSelectedSopIds] = useState<string[]>(
    position?.sops?.map((sop) => sop.id) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        id: position?.id,
        name,
        description,
        sopIds: selectedSopIds,
      });
    } catch (error) {
      console.error("Failed to submit position:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Required SOPs</label>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
          {availableSops.map((sop) => (
            <label key={sop.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedSopIds.includes(sop.id)}
                onChange={(e) => {
                  setSelectedSopIds((prev) =>
                    e.target.checked
                      ? [...prev, sop.id]
                      : prev.filter((id) => id !== sop.id)
                  );
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">
                {sop.name} (v{sop.version})
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : position ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
