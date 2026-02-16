"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Card } from "@notra/ui/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { PRICING_PLANS } from "../utils/constants";

type BillingPeriod = "monthly" | "annually";

function PricingCard({
  name,
  description,
  price,
  cta,
  features,
  variant = "default",
}: {
  name: string;
  description: string;
  price: React.ReactNode;
  cta: { label: string; href: string };
  features: readonly string[];
  variant?: "default" | "featured";
}) {
  const isFeatured = variant === "featured";

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
        render={<Link href={cta.href} />}
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
        {features.map((feature) => (
          <div
            className="flex items-center justify-start gap-[13px] self-stretch"
            key={feature}
          >
            <HugeiconsIcon
              className={`size-3 ${isFeatured ? "text-white" : "text-[#9CA3AF]"}`}
              icon={Tick02Icon}
            />
            <div
              className={`flex-1 font-normal font-sans text-[12.5px] leading-5 ${
                isFeatured ? "text-primary-foreground/95" : "text-foreground/80"
              }`}
            >
              {feature}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const { free, pro, enterprise } = PRICING_PLANS;

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <div className="flex items-center justify-center gap-6 self-stretch px-6 py-12 md:px-24 md:py-16">
        <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
          <div className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
            Pick the plan that fits your team
            <span className="text-primary">.</span>
          </div>

          <div className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
            Start generating content for free. Upgrade when you
            <br />
            need more integrations, posts, or team seats.
          </div>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center gap-0 self-stretch px-6 py-9 md:px-16">
        <div className="-translate-x-1/2 absolute top-[63px] left-1/2 z-0 h-0 w-full max-w-[1060px] transform border-primary/12 border-t" />

        <div className="relative z-20 flex items-center justify-center overflow-hidden rounded-lg border border-primary/6 bg-background p-3">
          <div className="relative flex h-auto gap-[2px] overflow-hidden rounded-[99px] border-[0.5px] border-primary/8 bg-primary/10 p-[2px]">
            <button
              className={`relative z-10 cursor-pointer rounded-[99px] px-4 py-1 transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "bg-white shadow-[0px_2px_4px_rgba(0,0,0,0.08)]"
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
                  ? "bg-white shadow-[0px_2px_4px_rgba(0,0,0,0.08)]"
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
          <div className="relative hidden w-12 self-stretch overflow-hidden md:block">
            <div className="absolute top-[-120px] left-[-58px] flex w-[162px] flex-col items-start justify-start">
              {Array.from({ length: 200 }).map((_, i) => (
                <div
                  className="-rotate-45 h-4 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                  key={i}
                />
              ))}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-y-12 py-12 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:grid-rows-[auto_auto_auto_1fr] md:gap-y-0 md:py-0">
            <PricingCard
              cta={free.cta}
              description={free.description}
              features={free.features}
              name={free.name}
              price={
                <div className="flex flex-col items-start justify-start gap-1">
                  <div className="flex h-[60px] items-center font-medium font-serif text-5xl text-primary leading-[60px]">
                    $0
                  </div>
                  <div className="font-medium font-sans text-muted-foreground text-sm">
                    per {billingPeriod === "monthly" ? "month" : "year"}.
                  </div>
                </div>
              }
            />

            <div className="relative hidden w-6 self-stretch overflow-hidden md:row-span-4 md:block lg:w-8">
              <div className="-top-30 -left-12.5 absolute flex w-35 flex-col items-start justify-start">
                {Array.from({ length: 200 }).map((_, i) => (
                  <div
                    className="-rotate-45 h-4 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                    key={i}
                  />
                ))}
              </div>
            </div>

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
              variant="featured"
            />

            <div className="relative hidden w-6 self-stretch overflow-hidden md:row-span-4 md:block lg:w-8">
              <div className="-top-30 -left-12.5 absolute flex w-35 flex-col items-start justify-start">
                {Array.from({ length: 200 }).map((_, i) => (
                  <div
                    className="-rotate-45 h-4 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                    key={i}
                  />
                ))}
              </div>
            </div>

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
            />
          </div>

          <div className="relative hidden w-12 self-stretch overflow-hidden md:block">
            <div className="absolute top-[-120px] left-[-58px] flex w-[162px] flex-col items-start justify-start">
              {Array.from({ length: 200 }).map((_, i) => (
                <div
                  className="-rotate-45 h-4 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                  key={i}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
