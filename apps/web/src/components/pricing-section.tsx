"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Card } from "@notra/ui/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { PRICING_PLANS } from "../utils/constants";
import { HatchPattern } from "./hatch-pattern";
import { TrackedSignupLink } from "./tracked-signup-link";

type BillingPeriod = "monthly" | "annually";

function PricingCard({
  name,
  description,
  price,
  cta,
  features,
  variant = "default",
  signupSource,
}: {
  name: string;
  description: string;
  price: React.ReactNode;
  cta: { label: string; href: string };
  features: readonly (string | { label: string; subtitle: string })[];
  signupSource: string;
  variant?: "default" | "featured";
}) {
  const isFeatured = variant === "featured";
  const ctaLink =
    cta.href === "https://app.usenotra.com/signup" ? (
      <TrackedSignupLink href={cta.href} source={signupSource} />
    ) : (
      <Link href={cta.href} />
    );

  return (
    <Card
      className={`row-span-4 grid grid-rows-subgrid gap-y-9 overflow-hidden rounded-none px-6 py-5 ring-0 ${
        isFeatured
          ? "border border-primary/12 bg-primary"
          : "border border-border bg-[rgba(255,255,255,0)]"
      }`}
    >
      <div className="flex flex-col items-start justify-start gap-2">
        <div
          className={`font-medium font-sans text-lg leading-7 ${
            isFeatured ? "text-primary-foreground" : "text-primary/90"
          }`}
        >
          {name}
        </div>
        <div
          className={`w-full max-w-[242px] font-normal font-sans text-sm leading-5 ${
            isFeatured ? "text-primary-foreground/70" : "text-foreground/70"
          }`}
        >
          {description}
        </div>
      </div>

      {price}

      <Button
        className={`w-full border-transparent px-4 py-[10px] shadow-[0px_2px_4px_rgba(55,50,47,0.12)] ${
          isFeatured
            ? "bg-white [a]:hover:bg-white/90"
            : "bg-primary hover:bg-primary-hover"
        }`}
        nativeButton={false}
        render={ctaLink}
      >
        <span
          className={`flex max-w-[108px] flex-col justify-center font-medium font-sans text-[13px] leading-5 ${
            isFeatured ? "text-primary" : "text-primary-foreground"
          }`}
        >
          {cta.label}
        </span>
      </Button>

      <div className="flex flex-col items-start justify-start gap-2 pt-3">
        {features.map((feature) => {
          const label = typeof feature === "string" ? feature : feature.label;
          const subtitle =
            typeof feature === "string" ? null : feature.subtitle;

          return (
            <div
              className="flex items-start justify-start gap-[13px] self-stretch"
              key={label}
            >
              <HugeiconsIcon
                className={`mt-[3px] size-3 ${isFeatured ? "text-white" : "text-[#9CA3AF]"}`}
                icon={Tick02Icon}
              />
              <div className="flex flex-1 flex-col">
                <div
                  className={`font-normal font-sans text-[12.5px] leading-5 ${
                    isFeatured
                      ? "text-primary-foreground/95"
                      : "text-foreground/80"
                  }`}
                >
                  {label}
                </div>
                {subtitle && (
                  <div
                    className={`font-normal font-sans text-[11px] leading-4 ${
                      isFeatured
                        ? "text-primary-foreground/60"
                        : "text-foreground/50"
                    }`}
                  >
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function PricingCards() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const { basic, pro, enterprise } = PRICING_PLANS;

  return (
    <>
      <div className="relative flex flex-col items-center justify-center gap-0 self-stretch px-6 py-9 md:px-16">
        <div className="-translate-x-1/2 absolute top-[63px] left-1/2 z-0 h-0 w-full max-w-[1060px] transform border-primary/12 border-t" />

        <div className="relative z-20 flex items-center justify-center overflow-hidden rounded-lg border border-primary/6 bg-background p-3">
          <div className="relative flex h-auto gap-[2px] overflow-hidden rounded-[99px] border-[0.5px] border-primary/8 bg-primary/10 p-[2px]">
            <button
              className={`relative z-10 cursor-pointer rounded-[99px] px-4 py-1 transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "bg-card shadow-[0px_2px_4px_rgba(0,0,0,0.08)]"
                  : "bg-transparent"
              }`}
              onClick={() => setBillingPeriod("monthly")}
              type="button"
            >
              <span
                className={`font-medium font-sans text-[13px] leading-5 transition-colors duration-300 ${
                  billingPeriod === "monthly"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Monthly
              </span>
            </button>

            <button
              className={`relative z-10 cursor-pointer rounded-[99px] px-4 py-1 transition-all duration-300 ${
                billingPeriod === "annually"
                  ? "bg-card shadow-[0px_2px_4px_rgba(0,0,0,0.08)]"
                  : "bg-transparent"
              }`}
              onClick={() => setBillingPeriod("annually")}
              type="button"
            >
              <span
                className={`font-medium font-sans text-[13px] leading-5 transition-colors duration-300 ${
                  billingPeriod === "annually"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Annually
              </span>
            </button>
          </div>

          <div className="absolute top-[5.25px] left-[5px] h-[3px] w-[3px] rounded-[99px] bg-primary/10 shadow-[0px_0px_0.5px_rgba(0,0,0,0.12)]" />
          <div className="absolute top-[5.25px] right-[5px] h-[3px] w-[3px] rounded-[99px] bg-primary/10 shadow-[0px_0px_0.5px_rgba(0,0,0,0.12)]" />
          <div className="absolute bottom-[5.25px] left-[5px] h-[3px] w-[3px] rounded-[99px] bg-primary/10 shadow-[0px_0px_0.5px_rgba(0,0,0,0.12)]" />
          <div className="absolute right-[5px] bottom-[5.25px] h-[3px] w-[3px] rounded-[99px] bg-primary/10 shadow-[0px_0px_0.5px_rgba(0,0,0,0.12)]" />
        </div>
      </div>

      <div className="flex items-center justify-center self-stretch shadow-[inset_0_-1px_0_var(--border)]">
        <div className="flex w-full items-start justify-center">
          <HatchPattern className="hidden w-12 self-stretch md:block" />

          <div className="grid flex-1 grid-cols-1 gap-y-12 py-12 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:grid-rows-[auto_auto_auto_1fr] md:gap-y-0 md:py-0">
            <PricingCard
              cta={basic.cta}
              description={basic.description}
              features={basic.features}
              name={basic.name}
              price={
                <div className="flex flex-col items-start justify-start gap-1">
                  <div className="flex h-[60px] items-center font-medium font-serif text-5xl text-primary leading-[60px]">
                    $
                    {billingPeriod === "monthly"
                      ? basic.pricing.monthly
                      : basic.pricing.annually}
                  </div>
                  <div className="font-medium font-sans text-muted-foreground text-sm">
                    per {billingPeriod === "monthly" ? "month" : "year"}.
                  </div>
                </div>
              }
              signupSource="pricing_basic"
            />

            <HatchPattern className="hidden w-6 self-stretch md:row-span-4 md:block lg:w-8" />

            <PricingCard
              cta={pro.cta}
              description={pro.description}
              features={pro.features}
              name={pro.name}
              price={
                <div className="flex flex-col items-start justify-start gap-1">
                  <div className="flex h-[60px] items-center font-medium font-serif text-5xl text-primary-foreground/95 leading-[60px]">
                    $
                    {billingPeriod === "monthly"
                      ? pro.pricing.monthly
                      : pro.pricing.annually}
                  </div>
                  <div className="font-medium font-sans text-primary-foreground/80 text-sm">
                    per {billingPeriod === "monthly" ? "month" : "year"}.
                  </div>
                </div>
              }
              signupSource="pricing_pro"
              variant="featured"
            />

            <HatchPattern className="hidden w-6 self-stretch md:row-span-4 md:block lg:w-8" />

            <PricingCard
              cta={enterprise.cta}
              description={enterprise.description}
              features={enterprise.features}
              name={enterprise.name}
              price={
                <div className="flex flex-col items-start justify-start gap-1">
                  <div className="flex h-[60px] items-center font-medium font-serif text-5xl text-primary leading-[60px]">
                    Contact us
                  </div>
                  <div className="font-medium font-sans text-muted-foreground text-sm">
                    for custom pricing.
                  </div>
                </div>
              }
              signupSource="pricing_enterprise"
            />
          </div>

          <HatchPattern className="hidden w-12 self-stretch md:block" />
        </div>
      </div>
    </>
  );
}
