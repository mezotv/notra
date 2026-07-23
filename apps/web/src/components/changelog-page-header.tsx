import { HeroDither } from "@/components/landing/hero-dither";
import type { ChangelogPageHeaderProps } from "~types/changelog";

export function ChangelogPageHeader({
  eyebrow,
  title,
  description,
  meta,
}: ChangelogPageHeaderProps) {
  return (
    <section className="w-full px-6 pt-6">
      <div className="relative isolate overflow-clip rounded-3xl bg-[#C8B2EE40] dark:bg-[#2a2140]">
        <div className="pointer-events-none absolute inset-0 overflow-clip rounded-3xl">
          <HeroDither className="-top-1.25 -left-10.75 absolute h-[66.125rem] w-[calc(100%+21.5rem)] min-w-[100.8125rem] bg-[#00000000]" />
        </div>
        <div className="relative mx-auto flex w-full max-w-[53.75rem] flex-col items-center gap-5 px-6 pt-28 pb-16 text-center lg:pt-[9.5rem] lg:pb-24">
          {eyebrow ? (
            <p className="font-medium font-sans text-[#1E1E1E99] text-sm uppercase tracking-[0.2em] dark:text-white/50">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="max-w-[56.875rem] text-balance font-display font-medium text-[#1E1E1E] text-[2.5rem] leading-[1.08] tracking-[-0.015em] sm:text-[3.25rem] lg:text-[4rem] lg:leading-[1.12] dark:text-white">
            {title}
          </h1>
          <div className="max-w-[42.875rem] text-balance font-medium font-sans text-[#1E1E1EBF] text-lg leading-7 dark:text-white/70">
            {description}
          </div>
          {meta ? <div className="pt-1">{meta}</div> : null}
        </div>
      </div>
    </section>
  );
}
