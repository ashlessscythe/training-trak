import { Button } from "@/components/ui/button";
import { ViewMode } from "@/hooks/useListView";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={viewMode === "card" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("card")}
      >
        Cards
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("table")}
      >
        Table
      </Button>
      <Button
        variant={viewMode === "responsive" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("responsive")}
      >
        Auto
      </Button>
    </div>
  );
}
