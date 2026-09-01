import { LiveTrafficLog } from "@/components/landing/live-traffic-log";

export function HeroCollage() {
  return (
    <div className="h-[36rem] w-full max-w-[64rem] overflow-hidden rounded-2xl border border-border bg-card">
      <LiveTrafficLog />
    </div>
  );
}
