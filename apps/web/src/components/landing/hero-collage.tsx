import { LiveTrafficLog } from "@/components/landing/live-traffic-log";

export function HeroCollage() {
  return (
    <div className="border-border bg-card h-[36rem] w-full max-w-[64rem] overflow-hidden rounded-2xl border">
      <LiveTrafficLog />
    </div>
  );
}
