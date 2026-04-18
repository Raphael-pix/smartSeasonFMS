import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sprout,
  Wheat,
  Flower,
  Trees,
  Calendar,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import type { FieldWithStatus } from "@/types/api.types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StageBadge } from "@/components/ui/StageBadge";
import { timeAgo } from "@/lib/format";

function pickIcon(crop: string) {
  const c = crop.toLowerCase();
  if (c.includes("maize") || c.includes("wheat") || c.includes("rice"))
    return Wheat;
  if (c.includes("bean") || c.includes("pea") || c.includes("legume"))
    return Sprout;
  if (c.includes("flower") || c.includes("rose")) return Flower;
  if (c.includes("tree") || c.includes("avocado") || c.includes("mango"))
    return Trees;
  return Sprout;
}

export function FieldCard({ field }: { field: FieldWithStatus }) {
  const Icon = useMemo(() => pickIcon(field.cropType), [field.cropType]);
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={"/fields/$id" as any}
      params={{ id: field.id } as any}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-28 w-full overflow-hidden bg-primary-soft">
        {field.coverImageUrl ? (
          <img
            src={field.coverImageUrl}
            alt={field.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-soft to-accent">
            <Icon className="h-10 w-10 text-primary/70" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={field.status} />
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-foreground">
            {field.name}
          </h3>
          <StageBadge stage={field.currentStage} />
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sprout className="h-3.5 w-3.5" /> {field.cropType}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {field.location.county}
            {field.location.subCounty ? ` · ${field.location.subCounty}` : ""}
          </div>
          {field.agent && (
            <div className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />{" "}
              {field.agent.fullName ?? field.agent.email}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Updated {timeAgo(field.lastUpdatedAt)}
          </div>
        </div>
      </div>
    </Link>
  );
}
