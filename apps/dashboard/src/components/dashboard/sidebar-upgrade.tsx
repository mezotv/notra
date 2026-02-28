"use client";

import { Button } from "@notra/ui/components/ui/button";
import { SidebarGroup } from "@notra/ui/components/ui/sidebar";
import { useCustomer, usePricingTable } from "autumn-js/react";
import { useState } from "react";
import { toast } from "sonner";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useOnboardingStatus } from "@/lib/hooks/use-onboarding";

export function SidebarUpgrade() {
  const { activeOrganization } = useOrganizationsContext();
  const orgId = activeOrganization?.id ?? "";

  const { data: onboarding } = useOnboardingStatus(orgId);
  const { customer, checkout } = useCustomer();
  const { products } = usePricingTable();
  const [loading, setLoading] = useState(false);

  const isOnboardingDone =
    onboarding?.onboardingCompleted || onboarding?.onboardingDismissed;

  const activeProduct = customer?.products.find(
    (p) => p.status === "active" || p.status === "trialing"
  );
  const isPro =
    activeProduct?.id === "pro" || activeProduct?.id === "pro_yearly";

  const proProduct = products?.find((p) => p.id === "pro");
  const hasFreeTrial = proProduct?.free_trial?.trial_available;

  if (!isOnboardingDone || isPro) {
    return null;
  }

  async function handleUpgrade() {
    const productId = proProduct?.id ?? "pro";
    setLoading(true);
    try {
      const { data, error } = await checkout({ productId });
      if (error) {
        toast.error(
          error.message || "Could not start checkout. Please try again."
        );
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not start checkout. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SidebarGroup className="px-3 pb-2 group-data-[collapsible=icon]:hidden">
      <div className="rounded-lg border bg-sidebar p-4">
        <p className="font-semibold text-sm">Upgrade to Pro</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Unlock higher limits, invite team members, and get more storage.
        </p>
        <Button
          className="mt-3 w-full"
          disabled={loading}
          onClick={handleUpgrade}
          size="sm"
        >
          {loading
            ? "Loading..."
            : hasFreeTrial
              ? "Start 3 day free trial"
              : "Upgrade to Pro"}
        </Button>
      </div>
    </SidebarGroup>
  );
}
