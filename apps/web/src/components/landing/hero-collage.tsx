import { LiveTrafficLog } from "@/components/landing/live-traffic-log";
import type { HeroCollageProps } from "@/types/landing/hero";

export function HeroCollage({ engine }: HeroCollageProps) {
  return (
    <div className="border-border bg-card h-[36rem] w-full max-w-[64rem] overflow-hidden rounded-2xl border">
      <LiveTrafficLog engine={engine} />
    </div>
  );
}
