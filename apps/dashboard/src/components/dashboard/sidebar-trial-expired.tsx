"use client";

import { FEATURES, PAID_OR_LEGACY_PLAN_IDS } from "@notra/ai/billing/features";
import { SidebarGroup } from "@notra/ui/components/ui/sidebar";
import { useCustomer } from "autumn-js/react";
import Link from "next/link";

import { Button } from "@/components/button";
import { useOrganizationsContext } from "@/components/providers/organization-provider";

export function SidebarTrialExpired() {
  const { activeOrganization } = useOrganizationsContext();
  const slug = activeOrganization?.slug ?? "";
  const { data: customer, isLoading } = useCustomer({
    expand: ["balances.feature", "subscriptions.plan"],
  });

  if (isLoading || !customer) {
    return null;
  }

  const hasActiveSubscription = customer.subscriptions.some(
    (subscription) =>
      !subscription.addOn &&
      subscription.status === "active" &&
      PAID_OR_LEGACY_PLAN_IDS.has(subscription.planId)
  );

  const aiCredits = customer.balances?.[FEATURES.AI_CREDITS];
  const hasCreditsBalance =
    typeof aiCredits?.remaining === "number" && aiCredits.remaining > 0;

  if (hasActiveSubscription || hasCreditsBalance) {
    return null;
  }

  return (
    <SidebarGroup className="px-3 pb-2 group-data-[collapsible=icon]:hidden">
      <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
        <div className="bg-muted/50 border-b px-3 py-3">
          <p className="text-sm font-semibold">Trial Ended</p>
        </div>
        <div className="space-y-3 p-3">
          <p className="text-muted-foreground text-xs">
            Your trial has ended. Subscribe to a plan to unlock full access.
            You&apos;re currently in read-only mode.
          </p>
          <Button
            className="w-full"
            nativeButton={false}
            render={<Link href={`/${slug}/settings/billing`} />}
            size="sm"
          >
            Choose a Plan
          </Button>
        </div>
      </div>
    </SidebarGroup>
  );
}
