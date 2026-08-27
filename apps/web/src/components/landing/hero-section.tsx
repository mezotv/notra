import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { cn } from "@notra/ui/lib/utils";
import Link from "next/link";

import { HeroCollage } from "@/components/landing/hero-collage";
import { HeroDither } from "@/components/landing/hero-dither";
import { TrackedSignupLink } from "@/components/tracked-signup-link";
import {
  HERO_BOOK_A_CALL_HREF,
  HERO_HEADLINE_MOBILE_BREAK_INDEX,
  HERO_HEADLINE_SEGMENTS,
  HERO_SIGNUP_SOURCE,
  HERO_SUBHEAD,
} from "@/constants/landing/hero";

const CTA_BUTTON_CLASSNAME =
  "h-auto rounded-[2.5625rem] px-4 py-2.5 font-display font-medium text-base leading-[1.14] tracking-[-0.015em] sm:px-6 sm:py-3 sm:text-[1.125rem]";

export function HeroSection() {
  return (
    <section className="w-full px-2 pt-2 antialiased [font-synthesis:none] sm:px-6 sm:pt-6">
      <div className="relative isolate overflow-clip rounded-3xl bg-[#C8B2EE40] lg:h-[59.9375rem] dark:bg-[#2a2140]">
        <div className="pointer-events-none absolute inset-0 overflow-clip rounded-3xl">
          <HeroDither className="absolute -top-1.25 -left-10.75 hidden h-[calc(100%+1.25rem)] w-[calc(100%+21.5rem)] min-w-[100.8125rem] bg-[#00000000] lg:block lg:h-[66.125rem]" />
        </div>

        <div className="relative flex h-full w-full flex-col items-center">
          <div className="flex flex-col items-center gap-8 px-6 pt-20 pb-2 sm:gap-10 sm:pt-24 lg:pt-[7.5rem]">
            <div className="flex flex-col items-center gap-7">
              <h1 className="font-display max-w-[20.5rem] text-center text-[clamp(1.5rem,calc(10.1vw-0.42rem),2.0625rem)] leading-[1.08] font-medium tracking-[-0.015em] text-[#1E1E1E] sm:max-w-[56.875rem] sm:text-[3.25rem] sm:font-semibold lg:text-[4.75rem] lg:leading-[1.12] dark:text-white">
                <span className="block whitespace-nowrap sm:hidden">
                  {HERO_HEADLINE_SEGMENTS.slice(
                    0,
                    HERO_HEADLINE_MOBILE_BREAK_INDEX
                  ).map((segment) => (
                    <span
                      className={cn(segment.accent && "text-primary")}
                      key={segment.text}
                    >
                      {segment.text}
                    </span>
                  ))}
                </span>
                <span className="block whitespace-nowrap sm:hidden">
                  {HERO_HEADLINE_SEGMENTS.slice(
                    HERO_HEADLINE_MOBILE_BREAK_INDEX
                  ).map((segment) => (
                    <span
                      className={cn(segment.accent && "text-primary")}
                      key={segment.text}
                    >
                      {segment.text}
                    </span>
                  ))}
                </span>
                <span className="hidden sm:inline">
                  {HERO_HEADLINE_SEGMENTS.map((segment) => (
                    <span
                      className={cn(segment.accent && "text-primary")}
                      key={segment.text}
                    >
                      {segment.text}
                    </span>
                  ))}
                </span>
              </h1>
              <p className="max-w-[42.875rem] text-center font-sans text-[1.0625rem] leading-[1.14] font-medium tracking-[-0.005em] text-[#1E1E1EBF] sm:text-[1.25rem] dark:text-white/70">
                {HERO_SUBHEAD}
              </p>
            </div>

            <div className="flex flex-row items-center gap-3 sm:gap-7">
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
