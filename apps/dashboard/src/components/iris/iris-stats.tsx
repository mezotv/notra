import {
  Clock01Icon,
  Note01Icon,
  RssIcon,
  Satellite02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IrisStats, IrisStatsRowProps, IrisStatTile } from "@/types/iris";
import { formatIrisRelativeTime } from "@/utils/iris-copy";

function buildTiles(stats: IrisStats): IrisStatTile[] {
  return [
    {
      key: "runs",
      label: "Runs, last 30 days",
      value: String(stats.runs30d),
      icon: Satellite02Icon,
    },
    {
      key: "artifacts",
      label: "Drafts, last 30 days",
      value: String(stats.artifacts30d),
      icon: Note01Icon,
    },
    {
      key: "signals",
      label: "Signals waiting",
      value: String(stats.signalsPending),
      icon: RssIcon,
    },
    {
      key: "last-run",
      label: "Last run",
      value: formatIrisRelativeTime(stats.lastRunAt),
      icon: Clock01Icon,
    },
  ];
}

export function IrisStatsRow({ stats }: IrisStatsRowProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {buildTiles(stats).map((tile) => (
        <div
          className="space-y-2 rounded-xl border border-border px-4 py-3"
          key={tile.key}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <HugeiconsIcon className="size-3.5" icon={tile.icon} />
            {tile.label}
          </div>
          <p className="font-semibold text-2xl tracking-tight">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}
