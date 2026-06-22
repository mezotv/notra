"use client";

import { SidebarGroup } from "@notra/ui/components/ui/sidebar";
import { useCustomer, useListPlans } from "autumn-js/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useOnboardingStatus } from "@/lib/hooks/use-onboarding";

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
  const isPro = activePlanId === "pro" || activePlanId === "pro_yearly";
  const isBasic = activePlanId === "basic" || activePlanId === "basic_yearly";
  const hasNoPlan = !activePlanId;

  const basicPlan = plans?.find((plan) => plan.id === "basic");
  const proPlan = plans?.find((plan) => plan.id === "pro");

  const showBasicTrial =
    hasNoPlan &&
    !!basicPlan?.freeTrial &&
    !!basicPlan.customerEligibility?.trialAvailable;

  const targetPlan = hasNoPlan ? basicPlan : proPlan;
  const targetPlanId = targetPlan?.id ?? (hasNoPlan ? "basic" : "pro");

  const buttonLabel = loading
    ? "Loading..."
    : showBasicTrial
      ? "Start 3 day free trial"
      : isBasic
        ? "Upgrade to Pro"
        : "Upgrade";

  const heading = isBasic ? "Upgrade to Pro" : "Get Started";
  const description = isBasic
    ? "Get more team seats, unlimited integrations, and higher usage limits."
    : "Start your 3 day free trial and unlock AI-powered workflows.";

  if (
    process.env.NEXT_PUBLIC_SHOW_UPGRADE_BUTTON !== "true" ||
    !isOnboardingDone ||
    isPro
  ) {
    return null;
  }

  async function handleUpgrade() {
    setLoading(true);
    try {
      const successUrl = activeOrganization?.slug
        ? `${window.location.origin}/${activeOrganization.slug}/settings/billing/success`
        : undefined;
      const result = await attach({
        planId: targetPlanId,
        redirectMode: "if_required",
        successUrl,
      });
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
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
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="border-b bg-muted/50 px-3 py-3">
          <p className="font-semibold text-sm">{heading}</p>
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
