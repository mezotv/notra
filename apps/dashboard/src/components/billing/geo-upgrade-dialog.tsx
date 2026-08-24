"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import { useCustomer, useListPlans } from "autumn-js/react";
import { useState } from "react";
import { toast } from "sonner";
import { PlanCard } from "@/components/billing/plan-card";
import { FEATURED_PLAN_TIER } from "@/constants/billing";
import { GEO_UPGRADE_DESCRIPTION, GEO_UPGRADE_TITLE } from "@/constants/geo";
import { attachPlanWithAddons } from "@/lib/billing/attach-plan";
import type { BillingPlanGroup } from "@/types/billing/plan";
import type { GeoUpgradeDialogProps } from "@/types/components/geo";
import {
  findZdrAddonPlan,
  getPricingButtonText,
  getProductFeatures,
  getProductPrice,
  groupBillingPlans,
  planGroupDescription,
  selectPlanVariant,
  zdrAddonToggle,
} from "@/utils/billing-plans";

const noop = () => undefined;

export function GeoUpgradeDialog({
  slug,
  open,
  onOpenChange,
}: GeoUpgradeDialogProps) {
  const { data: plans, isLoading: plansLoading } = useListPlans();
  const { attach, multiAttach, refetch } = useCustomer();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [includeZdr, setIncludeZdr] = useState(false);

  const planGroups = groupBillingPlans(plans);
  const intervalLabel = isYearly ? "year" : "month";

  async function handleSelectPlan(planId: string) {
    setLoading(planId);
    try {
      const result = await attachPlanWithAddons({
        attach,
        multiAttach,
        planId,
        includeZdr,
        successUrl: `${window.location.origin}/${slug}/geo`,
      });
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not start checkout. Please try again."
      );
    }
    setLoading(null);
  }

  function renderPlanCard(group: BillingPlanGroup) {
    const plan = selectPlanVariant(group, isYearly);
    const featured = group.id === FEATURED_PLAN_TIER;
    let label = plan ? getPricingButtonText(plan) : group.name;
    if (plan && loading === plan.id) {
      label = "Loading...";
    }
    return (
      <PlanCard
        action={featured ? <Badge>Most popular</Badge> : undefined}
        addon={zdrAddonToggle(
          findZdrAddonPlan(plans, plan?.id),
          includeZdr,
          setIncludeZdr
        )}
        button={{
          label,
          disabled: loading !== null || !plan,
          variant: featured ? "default" : "outline",
          onClick: plan ? () => handleSelectPlan(plan.id) : noop,
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
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{GEO_UPGRADE_TITLE}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {GEO_UPGRADE_DESCRIPTION}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="flex justify-center">
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
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {planGroups.map(renderPlanCard)}
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
