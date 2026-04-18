import { cn } from "@/lib/utils";
import type { FieldStatus } from "@/types/api.types";

const styles: Record<FieldStatus, { cls: string; label: string }> = {
  ACTIVE: {
    cls: "bg-success-soft text-success border border-success/20",
    label: "Active",
  },
  AT_RISK: {
    cls: "bg-warning-soft text-warning-foreground border border-warning/30",
    label: "At Risk",
  },
  COMPLETED: {
    cls: "bg-neutral-soft text-neutral-soft-foreground border border-border",
    label: "Completed",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: FieldStatus;
  className?: string;
}) {
  const s = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        s.cls,
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "ACTIVE" && "bg-success",
          status === "AT_RISK" && "bg-warning",
          status === "COMPLETED" && "bg-neutral-soft-foreground",
        )}
      />
      {s.label}
    </span>
  );
}
