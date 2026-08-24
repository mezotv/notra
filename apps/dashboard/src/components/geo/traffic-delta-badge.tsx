import { cn } from "@/lib/utils";
import {
  formatTrafficDelta,
  type TrafficDeltaTone,
  trafficDeltaTone,
} from "@/utils/ai-traffic";

interface TrafficDeltaBadgeProps {
  delta: number | null;
  className?: string;
}

const TRAFFIC_DELTA_TONE_CLASS: Record<TrafficDeltaTone, string> = {
  up: "bg-geo-up/10 text-geo-up",
  down: "bg-geo-down/10 text-geo-down",
  flat: "text-muted-foreground",
};

export function TrafficDeltaBadge({
  delta,
  className,
}: TrafficDeltaBadgeProps) {
  if (delta === null) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 font-medium text-[0.6875rem] tabular-nums leading-none",
        TRAFFIC_DELTA_TONE_CLASS[trafficDeltaTone(delta)],
        className
      )}
    >
      {formatTrafficDelta(delta)}
    </span>
  );
}
