"use client";

import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useCustomer, useListPlans } from "autumn-js/react";
import { useState } from "react";
import { toast } from "sonner";
import { FEATURES, PLANS } from "@/constants/features";
import type { ProductFeature } from "@/types/hooks/billing";

interface PricingClientProps {
  slug: string;
}

const PRICE_REGEX = /^\d+([.,]\d+)?$/;

type BillingPlan = Exclude<
  ReturnType<typeof useListPlans>["data"],
  undefined
>[number];

function getProductPrice(plan: BillingPlan | undefined): number {
  return plan?.price?.amount ?? 0;
}

function getProductFeatures(plan: BillingPlan | undefined): ProductFeature[] {
  if (!plan?.items) {
    return [];
  }

  return plan.items
    .map((item): ProductFeature | null => {
      const displayText = item.display?.primaryText ?? "";
      if (displayText.startsWith("$") || PRICE_REGEX.test(displayText)) {
        return null;
      }

      const overageText = item.display?.secondaryText;

      if (item.featureId === FEATURES.AI_CREDITS) {
        const cents = item.included ?? 0;
        if (cents > 0) {
          const dollars = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(cents / 100);
          return { text: `${dollars} AI Credits` };
        }
        return null;
      }

      if (displayText) {
        return { text: displayText, overageText };
      }

      const featureName = item.feature?.name ?? item.featureId;
      if (!featureName) {
        return null;
      }

      if (item.unlimited) {
        return { text: `Unlimited ${featureName.toLowerCase()}` };
      }

      const includedUsage = item.included;
      if (includedUsage > 0) {
        const interval = item.reset?.interval
          ? `per ${item.reset.interval}`
          : "";
        return {
          text: `${includedUsage} ${featureName} ${interval}`.trim(),
          overageText,
        };
      }

      return null;
    })
    .filter((f): f is ProductFeature => f !== null);
}

export function PricingClient({ slug }: PricingClientProps) {
  const { data: plans, isLoading: plansLoading } = useListPlans();
  const { attach } = useCustomer();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const basicMonthly = plans?.find((p) => p.id === PLANS.BASIC);
  const basicYearly = plans?.find((p) => p.id === PLANS.BASIC_YEARLY);
  const proMonthly = plans?.find((p) => p.id === PLANS.PRO);
  const proYearly = plans?.find((p) => p.id === PLANS.PRO_YEARLY);

  const basicPlan = isYearly ? (basicYearly ?? basicMonthly) : basicMonthly;
  const proPlan = isYearly ? (proYearly ?? proMonthly) : proMonthly;

  const basicFeatures = getProductFeatures(basicPlan);
  const proFeatures = getProductFeatures(proPlan);

  async function handleSelectPlan(planId: string | undefined) {
    if (!planId) {
      return;
    }
    setLoading(planId);
    try {
      const successUrl = `${window.location.origin}/${slug}/settings/billing/success`;
      const result = await attach({
        planId,
        redirectMode: "if_required",
        successUrl,
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        window.location.href = `/${slug}`;
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not start checkout. Please try again."
      );
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-12">
      <div className="space-y-3 text-center">
        <h1 className="font-bold text-3xl tracking-tight md:text-4xl">
          Choose your plan
        </h1>
        <p className="text-muted-foreground">
          Pick a plan to start using Notra. You can change or cancel anytime.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <Tabs
          onValueChange={(value) => setIsYearly(value === "yearly")}
          value={isYearly ? "yearly" : "monthly"}
        >
          <TabsList variant="line">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger className="flex items-center gap-1.5" value="yearly">
              Yearly
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-medium text-[10px] text-emerald-600">
                Save 20%
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {plansLoading ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[28rem] rounded-lg" />
          <Skeleton className="h-[28rem] rounded-lg" />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TitleCard
            action={<Badge variant="outline">3-day free trial</Badge>}
            className="transition-all hover:ring-2 hover:ring-muted-foreground/20"
            heading="Basic"
          >
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">
                  {basicPlan?.description ?? "For solo devs and small teams"}
                </p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-bold text-4xl leading-none">
                    ${getProductPrice(basicPlan)}
                  </span>
                  <span className="mb-1 text-muted-foreground text-sm">
                    /{isYearly ? "year" : "month"}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={loading !== null || !basicPlan}
                onClick={() => handleSelectPlan(basicPlan?.id)}
                variant="outline"
              >
                {loading === basicPlan?.id
                  ? "Loading..."
                  : "Start 3-day free trial"}
              </Button>

              <ul className="space-y-2.5 pt-2">
                {basicFeatures.map((feature) => (
                  <li
                    className="flex items-start gap-2 text-sm"
                    key={feature.text}
                  >
                    <HugeiconsIcon
                      className="mt-0.5 size-4 shrink-0 text-emerald-500"
                      icon={CheckmarkCircle02Icon}
                    />
                    <div>
                      <span>{feature.text}</span>
                      {feature.overageText && (
                        <p className="text-muted-foreground text-xs">
                          {feature.overageText}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TitleCard>

          <TitleCard
            action={<Badge>Most popular</Badge>}
            className="ring-2 ring-primary transition-all hover:ring-primary/80"
            heading="Pro"
          >
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">
                  {proPlan?.description ?? "For growing teams that need more"}
                </p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-bold text-4xl leading-none">
                    ${getProductPrice(proPlan)}
                  </span>
                  <span className="mb-1 text-muted-foreground text-sm">
                    /{isYearly ? "year" : "month"}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={loading !== null || !proPlan}
                onClick={() => handleSelectPlan(proPlan?.id)}
              >
                {loading === proPlan?.id ? "Loading..." : "Get started"}
              </Button>

              <ul className="space-y-2.5 pt-2">
                {proFeatures.map((feature) => (
                  <li
                    className="flex items-start gap-2 text-sm"
                    key={feature.text}
                  >
                    <HugeiconsIcon
                      className="mt-0.5 size-4 shrink-0 text-emerald-500"
                      icon={CheckmarkCircle02Icon}
                    />
                    <div>
                      <span>{feature.text}</span>
                      {feature.overageText && (
                        <p className="text-muted-foreground text-xs">
                          {feature.overageText}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TitleCard>
        </div>
      )}
    </div>
  );
}
