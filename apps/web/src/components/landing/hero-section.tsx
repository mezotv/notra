import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { cn } from "@notra/ui/lib/utils";
import Link from "next/link";
import { HeroCollage } from "@/components/landing/hero-collage";
import { HeroDither } from "@/components/landing/hero-dither";
import { TrackedSignupLink } from "@/components/tracked-signup-link";
import {
  HERO_BOOK_A_CALL_HREF,
  HERO_HEADLINE_SEGMENTS,
  HERO_SIGNUP_SOURCE,
  HERO_SUBHEAD,
} from "@/constants/landing/hero";

const CTA_BUTTON_CLASSNAME =
  "h-auto rounded-[2.5625rem] px-6 py-3 font-display font-medium text-[1.125rem] leading-[1.14] tracking-[-0.015em]";

export function HeroSection() {
  return (
    <section className="w-full px-6 pt-6 antialiased [font-synthesis:none]">
      <div className="relative isolate overflow-clip rounded-3xl bg-[#C8B2EE40] lg:h-[59.9375rem] dark:bg-[#2a2140]">
        <div className="pointer-events-none absolute inset-0 overflow-clip rounded-3xl">
          <HeroDither className="-top-1.25 -left-10.75 absolute h-[66.125rem] w-[calc(100%+21.5rem)] min-w-[100.8125rem] bg-[#00000000]" />
        </div>

        <div className="relative flex h-full w-full flex-col items-center">
          <div className="flex flex-col items-center gap-8 px-6 pt-28 pb-2 sm:gap-10 sm:pt-24 lg:pt-[7.5rem]">
            <div className="flex flex-col items-center gap-7">
              <h1 className="max-w-[56.875rem] text-center font-display font-medium text-[#1E1E1E] text-[2.5rem] leading-[1.08] tracking-[-0.015em] sm:font-semibold sm:text-[3.25rem] lg:text-[4.75rem] lg:leading-[1.12] dark:text-white">
                {HERO_HEADLINE_SEGMENTS.map((segment) => (
                  <span
                    className={cn(segment.accent && "text-primary")}
                    key={segment.text}
                  >
                    {segment.text}
                  </span>
                ))}
              </h1>
              <p className="max-w-[42.875rem] text-center font-medium font-sans text-[#1E1E1EBF] text-[1.0625rem] leading-[1.14] tracking-[-0.005em] sm:text-[1.25rem] dark:text-white/70">
                {HERO_SUBHEAD}
              </p>
            </div>

            <div className="flex flex-col items-center gap-7 sm:flex-row">
              <CtaButton
                className={CTA_BUTTON_CLASSNAME}
                nativeButton={false}
                render={<TrackedSignupLink source={HERO_SIGNUP_SOURCE} />}
                variant="primary"
              >
                Start for free
              </CtaButton>
              <CtaButton
                className={CTA_BUTTON_CLASSNAME}
                nativeButton={false}
                render={<Link href={HERO_BOOK_A_CALL_HREF} />}
                variant="light"
              >
                Book a Call
              </CtaButton>
            </div>
          </div>

          <div className="mt-9 flex w-full flex-1 flex-col items-center overflow-clip py-3.75 sm:mt-16.25">
            <div className="flex w-full flex-col items-center">
              <HeroCollage />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
