import { cn } from "@notra/ui/lib/utils";
import { MERCH_HERO_CALLOUTS } from "@/constants/merch";

export function MerchHeroCallouts() {
  return (
    <div aria-hidden="true" className="hidden xl:block">
      {MERCH_HERO_CALLOUTS.map((callout) => (
        <div
          className={cn(
            "absolute z-20 flex items-center gap-3",
            callout.className
          )}
          key={callout.number}
        >
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-[#1E1E1EA6] text-xs tracking-[0.08em] dark:text-white/60">
              {callout.number}
            </span>
            <span className="font-medium font-sans text-[#1E1E1E] text-[0.9375rem] leading-5 tracking-[-0.005em] dark:text-white">
              {callout.label}
            </span>
          </div>
          <div className="h-px w-44 bg-[#1E1E1E66] dark:bg-white/40" />
          <div className="size-1.75 rounded-full bg-primary" />
        </div>
      ))}
    </div>
  );
}
