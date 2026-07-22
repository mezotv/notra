import { cn } from "@notra/ui/lib/utils";
import { HeroDither } from "@/components/landing/hero-dither";
import type { MarketingHeroWashProps } from "~types/marketing-hero-wash";

export function MarketingHeroWash({
  children,
  className,
  title,
  subtitle,
}: MarketingHeroWashProps) {
  return (
    <section className={cn("w-full px-6 pt-6", className)}>
      <div className="relative isolate overflow-clip rounded-3xl bg-[#C8B2EE40] dark:bg-[#2a2140]">
        <div className="pointer-events-none absolute inset-0 overflow-clip rounded-3xl">
          <HeroDither className="-top-1.25 -left-10.75 absolute h-[66.125rem] w-[calc(100%+21.5rem)] min-w-[100.8125rem] bg-[#00000000]" />
        </div>
        <div className="relative flex flex-col items-center gap-5 px-6 pt-28 pb-16 text-center md:px-24 lg:pt-[9.5rem] lg:pb-24">
          <h1 className="max-w-[56.875rem] text-balance font-display font-medium text-[#1E1E1E] text-[2.5rem] leading-[1.08] tracking-[-0.015em] sm:text-[3.25rem] lg:text-[4rem] lg:leading-[1.12] dark:text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-[42.875rem] text-balance font-medium font-sans text-[#1E1E1EBF] text-lg leading-7 dark:text-white/70">
              {subtitle}
            </p>
          ) : null}
          {children ? (
            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:gap-7">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
