import { Button } from "@/components/ui/button";
import { User, Users, Briefcase, FileText, Calendar } from "lucide-react";

export type TrainingViewType = "user" | "department" | "sop" | "date";

interface TrainingViewSelectorProps {
  value: TrainingViewType;
  onChange: (value: TrainingViewType) => void;
  showDateOption?: boolean;
}

export function TrainingViewSelector({
  value,
  onChange,
  showDateOption = false,
}: TrainingViewSelectorProps) {
  return (
    <div className="flex items-center space-x-1 rounded-md bg-muted p-1">
      <Button
        variant={value === "user" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("user")}
        className="gap-1"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">By User</span>
      </Button>
      <Button
        variant={value === "department" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("department")}
        className="gap-1"
      >
        <Briefcase className="h-4 w-4" />
        <span className="hidden sm:inline">By Department</span>
      </Button>
      <Button
        variant={value === "sop" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("sop")}
        className="gap-1"
      >
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline">By SOP</span>
      </Button>
      {showDateOption && (
        <Button
          variant={value === "date" ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange("date")}
          className="gap-1"
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">By Date</span>
        </Button>
      )}
    </div>
  );
}
