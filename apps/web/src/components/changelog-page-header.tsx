import { ChangelogHeroDither } from "@/components/changelog-hero-dither";
import type { ChangelogPageHeaderProps } from "~types/changelog";

export function ChangelogPageHeader({
  eyebrow,
  title,
  description,
  meta,
}: ChangelogPageHeaderProps) {
  return (
    <div className="relative isolate w-full self-center overflow-clip rounded-3xl px-6 pt-4 pb-12 sm:pt-8 sm:pb-16">
      <div className="pointer-events-none absolute inset-0 overflow-clip">
        <ChangelogHeroDither className="-top-32 -left-24 absolute h-[34rem] w-[calc(100%+12rem)]" />
      </div>
      <div className="relative mx-auto flex w-full max-w-[53.75rem] flex-col items-center gap-6 text-center">
        {eyebrow ? (
          <p className="font-medium font-sans text-muted-foreground text-sm uppercase tracking-[0.2em]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-balance font-display font-medium text-[#1E1E1E] text-[2.5rem] leading-[1.08] tracking-[-0.015em] sm:text-[3.25rem] lg:text-[4.25rem] lg:leading-[1.12] dark:text-white">
          {title}
        </h1>
        <div className="max-w-[38.75rem] text-balance font-medium font-sans text-[#1E1E1EBF] text-[1.0625rem] leading-[1.28] tracking-[-0.005em] sm:text-[1.25rem] dark:text-white/70">
          {description}
        </div>
        {meta ? <div className="pt-1">{meta}</div> : null}
      </div>
    </div>
  );
}
