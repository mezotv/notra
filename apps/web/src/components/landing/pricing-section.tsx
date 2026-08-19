"use client";

import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { cn } from "@notra/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { PricingProShader } from "@/components/landing/pricing-pro-shader";
import { TrackedSignupLink } from "@/components/tracked-signup-link";
import {
  PRICING_HEADING,
  PRICING_PLANS,
  PRICING_SUBHEADING,
  TRACKED_ENGINES,
  TRACKED_ENGINES_CAPTION,
} from "@/constants/landing/pricing";
import { PRICING_ICONS } from "@/constants/landing/pricing-icons";
import type {
  LandingPricingSectionProps,
  PricingCardProps,
} from "@/types/landing/pricing";

function TrackedEnginesRow() {
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-center font-medium font-sans text-[#1E1E1E99] text-sm tracking-[-0.01em] dark:text-white/50">
        {TRACKED_ENGINES_CAPTION}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-5">
        {TRACKED_ENGINES.map((engine) =>
          engine.darkSrc ? (
            <span className="inline-flex" key={engine.name} title={engine.name}>
              <Image
                alt={engine.name}
                className="h-7 w-auto dark:hidden"
                height={28}
                src={engine.src}
                unoptimized
                width={engine.width}
              />
              <Image
                alt={engine.name}
                className="hidden h-7 w-auto dark:block"
                height={28}
                src={engine.darkSrc}
                unoptimized
                width={engine.width}
              />
            </span>
          ) : (
            <Image
              alt={engine.name}
              className="h-7 w-auto"
              height={28}
              key={engine.name}
              src={engine.src}
              title={engine.name}
              unoptimized
              width={engine.width}
            />
          )
        )}
      </div>
    </div>
  );
}

function PricingCard({ plan }: PricingCardProps) {
  const isFeatured = plan.variant === "featured";

  const ctaLink =
    plan.cta.kind === "signup" ? (
      <TrackedSignupLink href={plan.cta.href} source={plan.cta.source} />
    ) : (
      <Link href={plan.cta.href} />
    );

  return (
    <article
      className={cn(
        "relative flex h-184 w-full flex-col overflow-clip rounded-3xl lg:order-none",
        isFeatured
          ? "order-first bg-[#8B5CF6]"
          : "bg-[#F7F7F7] dark:bg-white/[0.04]"
      )}
    >
      {isFeatured && <PricingProShader />}

      <div className="relative z-10 flex h-full flex-col">
        <div
          className={cn(
            "m-1.75 flex h-34 flex-col gap-2 rounded-2xl px-4.25 py-8.25",
            isFeatured
              ? "border border-white/5 bg-white/10 shadow-[inset_0_0_1.29375rem_#FFFFFF1A]"
              : "bg-white shadow-[0_0.125rem_0.3125rem_#00000008] dark:bg-white/[0.04]"
          )}
        >
          <h3
            className={cn(
              "font-display font-medium text-[1.375rem] leading-7 tracking-[0.01em]",
              isFeatured
                ? "font-semibold text-white"
                : "text-black dark:text-white"
            )}
          >
            {plan.name}
          </h3>
          <p
            className={cn(
              "font-normal font-sans text-[0.9375rem] leading-[1.125rem] tracking-[-0.015em]",
              isFeatured ? "text-white/70" : "text-[#6B6B6B] dark:text-white/60"
            )}
          >
            {plan.description}
          </p>
        </div>

        <div className="flex flex-1 flex-col px-6 pt-4.5">
          <div className="flex flex-col items-start gap-3.25">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-display font-normal text-[2.625rem] leading-13 tracking-[-0.01em]",
                  isFeatured ? "text-white" : "text-[#1E1E1E] dark:text-white"
                )}
              >
                {plan.price.monthly}
              </span>
              {plan.priceSuffix ? (
                <span
                  className={cn(
                    "font-normal font-sans text-sm leading-[1.125rem] tracking-[-0.015em]",
                    isFeatured
                      ? "text-white/70"
                      : "text-[#1E1E1EB3] dark:text-white/60"
                  )}
                >
                  {plan.priceSuffix.monthly}
                </span>
              ) : null}
            </div>

            <CtaButton
              className="w-full"
              nativeButton={false}
              render={ctaLink}
              variant={isFeatured ? "light" : "primary"}
            >
              <span>{plan.cta.label}</span>
              {plan.cta.showArrow ? (
                <HugeiconsIcon className="size-4" icon={ArrowRight02Icon} />
              ) : null}
            </CtaButton>
          </div>

          <div
            className={cn(
              "mt-8 h-px w-full",
              isFeatured ? "bg-white/20" : "bg-black/20 dark:bg-white/15"
            )}
          />

          <ul className="mt-10.5 flex flex-col gap-3">
            {plan.features.map((feature) => {
              const Icon = PRICING_ICONS[feature.icon];

              return (
                <li className="flex items-center gap-2" key={feature.label}>
                  <span
                    className={cn(
                      "shrink-0",
                      isFeatured
                        ? "text-white"
                        : "text-[#1E1E1EBF] dark:text-white/60"
                    )}
                  >
                    <Icon className="size-6" />
                  </span>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "font-normal font-sans text-sm leading-[1.125rem]",
                        isFeatured
                          ? "text-white"
                          : "text-[#1E1E1EBF] dark:text-white/70"
                      )}
                    >
                      {feature.label}
                    </span>
                    {feature.subtitle ? (
                      <span
                        className={cn(
                          "font-normal font-sans text-xs leading-4",
                          isFeatured
                            ? "text-white/90"
                            : "text-[#1E1E1E99] dark:text-white/50"
                        )}
                      >
                        {feature.subtitle}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function LandingPricingSection({
  showHeader = true,
}: LandingPricingSectionProps) {
  return (
    <section
      className="flex w-full flex-col items-center gap-13.5 px-6 py-24"
      id="pricing"
    >
      {showHeader ? (
        <div className="flex flex-col items-center gap-6">
          <h2 className="max-w-[59rem] text-balance text-center font-display font-medium text-[#1E1E1E] text-[2rem] leading-[1.12] tracking-[-0.02em] sm:text-[2.875rem] sm:leading-13 dark:text-white">
            {PRICING_HEADING}
          </h2>
          <p className="max-w-[43rem] text-balance text-center font-medium font-sans text-[#1E1E1EBF] text-lg leading-7 sm:text-xl dark:text-white/70">
            {PRICING_SUBHEADING}
          </p>
        </div>
      ) : null}

      <div className="grid w-full max-w-96 grid-cols-1 gap-4 lg:max-w-[80rem] lg:grid-cols-4">
        {PRICING_PLANS.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>

      <TrackedEnginesRow />
    </section>
  );
}
