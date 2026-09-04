"use client";

import { Link04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";

import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { ShelfPlacementBadge } from "@/components/geo/shelf/shelf-placement-badge";
import {
  GEO_SHELF_PLACEMENT_LABELS,
  GEO_SHELF_PLACEMENT_STATUSES,
} from "@/constants/geo-shelf";
import type {
  GeoShelfPlacementStatus,
  GeoShelfPlacementsTableProps,
} from "@/types/geo-shelf";
import { formatRelative } from "@/utils/format-relative";

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
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="bg-muted/40 text-muted-foreground text-xs">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Brand</th>
            <th className="px-3 py-2 text-left font-medium">On the page</th>
            <th className="px-3 py-2 text-right font-medium">Position</th>
            <th className="px-3 py-2 text-left font-medium">Link</th>
            <th className="px-3 py-2 text-left font-medium">Checked</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {placements.map((placement) => {
            const isOwn = placement.competitorId === null;
            return (
              <tr key={placement.competitorId ?? "own"}>
                <td className="px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <CompetitorLogo
                      className="size-5 shrink-0 rounded-md"
                      domain={placement.brandDomain}
                      name={placement.brandName}
                    />
                    <span className="truncate font-medium">
                      {isOwn
                        ? ownBrandName || placement.brandName
                        : placement.brandName}
                      {isOwn ? (
                        <span className="text-muted-foreground ml-1 font-normal">
                          (You)
                        </span>
                      ) : null}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2">
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
                      className="h-7 w-36 border-transparent bg-transparent px-1 shadow-none"
                    >
                      <SelectValue>
                        <ShelfPlacementBadge
                          evidence={placement.evidence}
                          status={placement.status}
                        />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {GEO_SHELF_PLACEMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {GEO_SHELF_PLACEMENT_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {placement.position ? `#${placement.position}` : "-"}
                </td>
                <td className="px-3 py-2">
                  {placement.hasLink ? (
                    <span className="inline-flex items-center gap-1 text-xs">
                      <HugeiconsIcon className="size-3.5" icon={Link04Icon} />
                      Links out
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
                <td className="text-muted-foreground px-3 py-2 text-xs">
                  {formatRelative(placement.checkedAt)}
                  {placement.evidence === "manual" ? " · by hand" : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
