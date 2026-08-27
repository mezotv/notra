"use client";

import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import { useCustomer, useListPlans } from "autumn-js/react";
import { useState } from "react";
import { toast } from "sonner";

import { PlanCard } from "@/components/billing/plan-card";
import { OnboardingProgress } from "@/components/onboarding/progress";
import { FEATURED_PLAN_TIER } from "@/constants/billing";
import { ONBOARDING_STEP_PRICING } from "@/constants/onboarding";
import { attachPlanWithAddons } from "@/lib/billing/attach-plan";
import type { BillingPlanGroup } from "@/types/billing/plan";
import type { PricingClientProps } from "@/types/onboarding";
import {
  findZdrAddonPlan,
  getProductFeatures,
  getProductPrice,
  groupBillingPlans,
  planGroupDescription,
  selectPlanVariant,
  zdrAddonToggle,
} from "@/utils/billing-plans";

export function PricingClient({ slug }: PricingClientProps) {
  const { data: plans, isLoading: plansLoading } = useListPlans();
  const { attach, multiAttach } = useCustomer();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [includeZdr, setIncludeZdr] = useState(false);

  const planGroups = groupBillingPlans(plans);
  const intervalLabel = isYearly ? "year" : "month";

  async function handleSelectPlan(planId: string) {
    setLoading(planId);
    try {
      const successUrl = `${window.location.origin}/${slug}/settings/billing/success`;
      const result = await attachPlanWithAddons({
        attach,
        multiAttach,
        planId,
        includeZdr,
        successUrl,
      });

      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
      } else {
        window.location.assign(`/${slug}`);
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

  function renderPlanCard(group: BillingPlanGroup) {
    const plan = selectPlanVariant(group, isYearly);
    if (!plan) {
      return null;
    }
    const featured = group.id === FEATURED_PLAN_TIER;
    const hasTrial = Boolean(
      plan.freeTrial && plan.customerEligibility?.trialAvailable
    );
    let action: React.ReactNode;
    if (hasTrial) {
      action = <Badge variant="outline">Free trial</Badge>;
    } else if (featured) {
      action = <Badge>Most popular</Badge>;
    }
    let label = hasTrial ? "Start free trial" : "Get started";
    if (loading === plan.id) {
      label = "Loading...";
    }
    return (
      <PlanCard
        action={action}
        addon={zdrAddonToggle(
          findZdrAddonPlan(plans, plan.id),
          includeZdr,
          setIncludeZdr
        )}
        button={{
          label,
          disabled: loading !== null,
          variant: featured ? "default" : "outline",
          onClick: () => handleSelectPlan(plan.id),
        }}
        description={planGroupDescription(group)}
        featured={featured}
        features={getProductFeatures(plan)}
        highlighted={false}
        intervalLabel={intervalLabel}
        key={group.id}
        name={group.name}
        price={getProductPrice(plan).amount}
      />
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-12">
      <div className="mb-6 flex justify-center">
        <OnboardingProgress current={ONBOARDING_STEP_PRICING} />
      </div>
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
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
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                Save 20%
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <p className="text-muted-foreground mt-3 text-center text-xs">
        Your plan renews automatically every {intervalLabel} until you cancel.
      </p>

      {plansLoading ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[28rem] rounded-lg" />
          <Skeleton className="h-[28rem] rounded-lg" />
          <Skeleton className="h-[28rem] rounded-lg" />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {planGroups.map(renderPlanCard)}
        </div>
      )}
    </div>
  );
}
