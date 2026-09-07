"use client";

import { Link04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { GEO_SHELF_PLACEMENT_STATUSES } from "@notra/schemas/constants/dashboard/geo-shelf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";

import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { ShelfPlacementMark } from "@/components/geo/shelf/shelf-placement-badge";
import { cn } from "@/lib/utils";
import type {
  GeoShelfPlacementStatus,
  GeoShelfPlacementsTableProps,
} from "@/types/geo-shelf";

function toPlacementStatus(value: string): GeoShelfPlacementStatus {
  return (
    GEO_SHELF_PLACEMENT_STATUSES.find((status) => status === value) ?? "unknown"
  );
}

export function ShelfPlacementsTable({
  row,
  ownBrandName,
  onSetPlacementStatus,
  disabled,
}: GeoShelfPlacementsTableProps) {
  const placements = [
    ...(row.ownPlacement ? [row.ownPlacement] : []),
    ...row.competitorPlacements,
  ];

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[32rem] text-sm">
        <thead className="text-muted-foreground text-xs">
          <tr className="border-b">
            <th className="px-3.5 py-2.5 text-left font-medium">Brand</th>
            <th className="px-3.5 py-2.5 text-left font-medium">On the page</th>
            <th className="px-3.5 py-2.5 text-right font-medium">Position</th>
            <th className="px-3.5 py-2.5 text-left font-medium">Link</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {placements.map((placement) => {
            const isOwn = placement.competitorId === null;
            const brandName = isOwn
              ? ownBrandName || placement.brandName
              : placement.brandName;
            return (
              <tr key={placement.competitorId ?? "own"}>
                <td className="px-3.5 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <CompetitorLogo
                      className="size-5 shrink-0 rounded-md outline outline-black/10 dark:outline-white/10"
                      domain={placement.brandDomain}
                      name={placement.brandName}
                    />
                    <span className="truncate font-medium">
                      {brandName}
                      {isOwn ? (
                        <span className="text-muted-foreground ml-1 font-normal">
                          (You)
                        </span>
                      ) : null}
                    </span>
                  </span>
                </td>
                <td className="px-3.5 py-2.5">
                  <Select
                    disabled={disabled}
                    onValueChange={(value) =>
                      onSetPlacementStatus(
                        row.id,
                        placement.competitorId,
                        toPlacementStatus(value ?? "unknown")
                      )
                    }
                    value={placement.status}
                  >
                    <SelectTrigger
                      aria-label={`Presence of ${placement.brandName}`}
                      className="w-40"
                      size="sm"
                    >
                      <SelectValue>
                        <ShelfPlacementMark status={placement.status} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {GEO_SHELF_PLACEMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          <ShelfPlacementMark status={status} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td
                  className={cn(
                    "px-3.5 py-2.5 text-right tabular-nums",
                    !placement.position && "text-muted-foreground"
                  )}
                >
                  {placement.position ? `#${placement.position}` : "—"}
                </td>
                <td className="px-3.5 py-2.5">
                  {placement.hasLink ? (
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <HugeiconsIcon className="size-3.5" icon={Link04Icon} />
                      Outbound
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
