import { cn } from "@/lib/utils";
import type { CropStage } from "@/types/api.types";

const labels: Record<CropStage, string> = {
  PLANTED: "Planted",
  GROWING: "Growing",
  READY: "Ready",
  HARVESTED: "Harvested",
};

const styles: Record<CropStage, string> = {
  PLANTED: "bg-amber-100 text-amber-900 border-amber-200",
  GROWING: "bg-emerald-100 text-emerald-900 border-emerald-200",
  READY: "bg-orange-100 text-orange-900 border-orange-200",
  HARVESTED: "bg-stone-200 text-stone-700 border-stone-300",
};

export function StageBadge({
  stage,
  className,
}: {
  stage: CropStage;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        styles[stage],
        className,
      )}
    >
      {labels[stage]}
    </span>
  );
}
