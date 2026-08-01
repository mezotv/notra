import { Github01Icon, RssIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import type { IrisSignalsListProps } from "@/types/iris";
import {
  formatIrisRelativeTime,
  humanizeIrisSignalKind,
  humanizeIrisSignalStatus,
} from "@/utils/iris-copy";

function sourceIcon(source: string) {
  return source === "github" ? Github01Icon : RssIcon;
}

export function IrisSignalsList({ signals }: IrisSignalsListProps) {
  if (signals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
        Nothing has come in yet. Iris starts watching as soon as you ship.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {signals.map((signal) => (
        <li className="flex items-center gap-3 px-4 py-3" key={signal.id}>
          <HugeiconsIcon
            className="size-4 shrink-0 text-muted-foreground"
            icon={sourceIcon(signal.source)}
          />
          <span className="min-w-0 flex-1 truncate font-medium text-sm">
            {humanizeIrisSignalKind(signal.kind)}
          </span>
          <Badge variant="outline">
            {humanizeIrisSignalStatus(signal.status)}
          </Badge>
          <span className="shrink-0 text-muted-foreground text-xs">
            {formatIrisRelativeTime(signal.occurredAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
