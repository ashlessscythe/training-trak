import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
}

interface ListViewProps<T> {
  data: T[];
  columns: Column<T>[];
  view: "card" | "table";
  renderCard: (item: T) => ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
}

export function ListView<T>({
  data,
  columns,
  view,
  renderCard,
  keyExtractor,
  emptyMessage = "No items found.",
}: ListViewProps<T>) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
    );
  }

  if (view === "card") {
    return <div className="grid gap-4">{data.map(renderCard)}</div>;
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-left text-sm font-medium ${
                    column.className || ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="border-b">
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={`px-4 py-3 text-sm ${column.className || ""}`}
                  >
                    {typeof column.accessor === "function"
                      ? column.accessor(item)
                      : (item[column.accessor] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
