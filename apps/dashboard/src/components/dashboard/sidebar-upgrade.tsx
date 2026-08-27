"use client";

import { SidebarGroup } from "@notra/ui/components/ui/sidebar";
import { useCustomer, useListPlans } from "autumn-js/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useOnboardingStatus } from "@/lib/hooks/use-onboarding";
import { groupBillingPlans, nextPlanGroup } from "@/utils/billing-plans";

export function SidebarUpgrade() {
  const { activeOrganization } = useOrganizationsContext();
  const orgId = activeOrganization?.id ?? "";

  const { data: onboarding } = useOnboardingStatus(orgId);
  const {
    attach,
    data: customer,
    refetch,
  } = useCustomer({
    expand: ["subscriptions.plan"],
  });
  const { data: plans } = useListPlans();
  const [loading, setLoading] = useState(false);

  const isOnboardingDone =
    onboarding?.onboardingCompleted || onboarding?.onboardingDismissed;

  const activeSubscription = customer?.subscriptions.find(
    (subscription) => !subscription.addOn && subscription.status === "active"
  );
  const activePlanId =
    activeSubscription?.plan?.id ?? activeSubscription?.planId;
  const hasNoPlan = !activePlanId;

  const targetGroup = nextPlanGroup(groupBillingPlans(plans), activePlanId);
  const targetPlan = targetGroup?.monthly ?? targetGroup?.annual ?? null;

  const showTrial =
    hasNoPlan &&
    !!targetPlan?.freeTrial &&
    !!targetPlan.customerEligibility?.trialAvailable;

  let buttonLabel = hasNoPlan
    ? "Get started"
    : `Upgrade to ${targetGroup?.name}`;
  if (showTrial) {
    buttonLabel = "Start free trial";
  }
  if (loading) {
    buttonLabel = "Loading...";
  }

  const heading = hasNoPlan ? "Get Started" : `Upgrade to ${targetGroup?.name}`;
  let description = "Get more AI answers, projects, and higher usage limits.";
  if (hasNoPlan) {
    description = showTrial
      ? "Start your free trial and unlock AI-powered workflows."
      : "Pick a plan to unlock AI-powered workflows.";
  }

  if (
    process.env.NEXT_PUBLIC_SHOW_UPGRADE_BUTTON !== "true" ||
    !isOnboardingDone ||
    !targetPlan
  ) {
    return null;
  }

  async function handleUpgrade() {
    if (!targetPlan) {
      return;
    }
    setLoading(true);
    const successUrl = activeOrganization?.slug
      ? `${window.location.origin}/${activeOrganization.slug}/settings/billing/success`
      : undefined;
    try {
      const result = await attach({
        planId: targetPlan.id,
        redirectMode: "if_required",
        successUrl,
      });
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
      } else {
        await refetch();
      }
    } catch (err) {
      setLoading(false);
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not update billing. Please try again."
      );
      return;
    }
    setLoading(false);
  }

  return (
    <SidebarGroup className="px-3 pb-2 group-data-[collapsible=icon]:hidden">
      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        <div className="bg-muted/50 border-b px-3 py-3">
          <p className="text-sm font-semibold">{heading}</p>
        </div>
        <div className="space-y-3 p-3">
          <p className="text-muted-foreground text-xs">{description}</p>
          <Button
            className="w-full"
            disabled={loading}
            onClick={handleUpgrade}
            size="sm"
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </SidebarGroup>
  );
}
