import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TrainingViewType = "sop" | "user" | "department";

interface TrainingViewSelectorProps {
  value: TrainingViewType;
  onChange: (value: TrainingViewType) => void;
}

export function TrainingViewSelector({ value, onChange }: TrainingViewSelectorProps) {
  return (
    <Select value={value} onValueChange={(value) => onChange(value as TrainingViewType)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="View by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sop">View by SOP</SelectItem>
        <SelectItem value="user">View by User</SelectItem>
        <SelectItem value="department">View by Department</SelectItem>
      </SelectContent>
    </Select>
  );
}
