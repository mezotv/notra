import { GEO_JOURNEY_TRAIL_TABLE_LIMIT } from "@notra/geo-core/constants/geo";
import { Fragment } from "react";

import {
  JourneyPathJoin,
  JourneyPathPill,
} from "@/components/geo/journey-path-pill";
import { cn } from "@/lib/utils";
import type { JourneyPathTrailProps } from "@/types/geo";
import { compactJourneyPaths, isGeoJourneyTrailGap } from "@/utils/geo-journey";

export function JourneyPathTrail({
  paths,
  limit = GEO_JOURNEY_TRAIL_TABLE_LIMIT,
  className,
}: JourneyPathTrailProps) {
  const trail = compactJourneyPaths(paths, limit);
  const pathOccurrences = new Map<string, number>();
  const keyedNodes = trail.nodes.map((node) => {
    const occurrence = (pathOccurrences.get(node.path) ?? 0) + 1;
    pathOccurrences.set(node.path, occurrence);
    return { key: `${node.path}:${occurrence}`, node };
  });

  if (trail.nodes.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <span
      className={cn("flex min-w-0 flex-wrap items-center gap-y-1", className)}
      title={
        trail.omitted > 0
          ? `${paths.join(" → ")} (${trail.omitted} hidden)`
          : paths.join(" → ")
      }
    >
      {keyedNodes.map(({ key, node }, index) => (
        <Fragment key={key}>
          {index > 0 && !isGeoJourneyTrailGap(node.path) ? (
            <JourneyPathJoin />
          ) : null}
          <JourneyPathPill node={node} />
        </Fragment>
      ))}
    </span>
  );
}
