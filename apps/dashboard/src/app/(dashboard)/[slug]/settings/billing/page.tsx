"use client";

import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { useListPlans } from "autumn-js/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { InvoicesTable } from "@/components/billing/invoices-table";
import { PlanCard } from "@/components/billing/plan-card";
import { UsageSection } from "@/components/billing/usage-section";
import { ZdrAddonCard } from "@/components/billing/zdr-addon-card";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { PLAN_SURFACES } from "@/constants/analytics-events";
import {
  BILLING_SECTION_VALUES,
  FEATURED_PLAN_TIER,
  PLANS_ANCHOR,
} from "@/constants/billing";
import {
  billingInterval,
  planSelectedProperties,
} from "@/lib/analytics/billing-events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { attachPlanWithAddons } from "@/lib/billing/attach-plan";
import { useBillingCustomer } from "@/lib/hooks/use-billing-customer";
import { useHasZdrEntitlement } from "@/lib/hooks/use-plan";
import type { BillingPlanGroup, PlanCardButton } from "@/types/billing/plan";
import {
  findZdrAddonPlan,
  getPricingButtonText,
  getProductFeatures,
  getProductPrice,
  groupBillingPlans,
  isAnnualPlanId,
  isPlanInGroup,
  planGroupDescription,
  selectPlanVariant,
  zdrAddonToggle,
} from "@/utils/billing-plans";

import { DashboardPageSkeleton } from "../../skeleton";

const noop = () => undefined;

function BillingPageContent() {
  const { activeOrganization } = useOrganizationsContext();
  const { data: plans, isLoading: plansLoading } = useListPlans();
  const {
    attach,
    multiAttach,
    openCustomerPortal,
    data: customer,
    isLoading: customerLoading,
    refetch,
  } = useBillingCustomer({
    expand: ["invoices", "subscriptions.plan"],
  });
  const [activeSection, setActiveSection] = useQueryState(
    "tab",
    parseAsStringLiteral(BILLING_SECTION_VALUES).withDefault("billing")
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [includeZdr, setIncludeZdr] = useState(false);
  const { hasZdr } = useHasZdrEntitlement();
  const [now] = useState(() => Date.now());

  const invoices = customer?.invoices;

  const activeSubscription = customer?.subscriptions.find(
    (subscription) => !subscription.addOn && subscription.status === "active"
  );
  const activePlanId =
    activeSubscription?.plan?.id ?? activeSubscription?.planId;

  useEffect(() => {
    if (activePlanId) {
      setIsYearly(isAnnualPlanId(activePlanId));
    }
  }, [activePlanId]);

  const isTrialing =
    activeSubscription?.trialEndsAt != null &&
    activeSubscription.trialEndsAt > now;

  function handleIntervalChange(value: string) {
    const yearly = value === "yearly";
    trackEvent(POSTHOG_EVENTS.PRICING_INTERVAL_TOGGLED, {
      interval: billingInterval(yearly),
      surface: PLAN_SURFACES.BILLING_PAGE,
    });
    setIsYearly(yearly);
  }

  function handleIncludeZdrChange(checked: boolean) {
    trackEvent(POSTHOG_EVENTS.ZDR_ADDON_TOGGLED, {
      enabled: checked,
      surface: PLAN_SURFACES.BILLING_PAGE,
    });
    setIncludeZdr(checked);
  }

  async function handleCheckout(planId: string) {
    setLoading(planId);
    trackEvent(
      POSTHOG_EVENTS.PLAN_SELECTED,
      planSelectedProperties({
        plans,
        planId,
        isYearly,
        includeZdr,
        surface: PLAN_SURFACES.BILLING_PAGE,
      })
    );
    const successUrl = activeOrganization?.slug
      ? `${window.location.origin}/${activeOrganization.slug}/settings/billing/success`
      : undefined;
    try {
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
        await refetch();
      }
    } catch (err) {
      console.error("Attach error:", err);
      trackEvent(POSTHOG_EVENTS.CHECKOUT_FAILED, {
        plan_id: planId,
        surface: PLAN_SURFACES.BILLING_PAGE,
      });
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not update billing. Please try again."
      );
    }
    setLoading(null);
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    trackEvent(POSTHOG_EVENTS.CUSTOMER_PORTAL_OPENED, {
      surface: PLAN_SURFACES.BILLING_PAGE,
    });
    const returnUrl = `${window.location.origin}/${activeOrganization?.slug}/settings/billing`;
    try {
      await openCustomerPortal({
        returnUrl,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not open billing portal. Please try again."
      );
    }
    setPortalLoading(false);
  }

  const isBillingLoading = plansLoading || customerLoading;

  const planGroups = groupBillingPlans(plans);
  const trialPlan = planGroups
    .map((group) => group.monthly ?? group.annual)
    .find((plan) => plan?.freeTrial);
  const plansDescription = trialPlan
    ? `Upgrade or change your plan. ${trialPlan.name} includes a free trial.`
    : "Upgrade or change your plan.";
  const intervalLabel = isYearly ? "year" : "month";

  function handleSectionChange(value: string) {
    setActiveSection(value === "usage" ? "usage" : "billing");
  }

  function planButton(group: BillingPlanGroup): PlanCardButton {
    const plan = selectPlanVariant(group, isYearly);
    const variant = group.id === FEATURED_PLAN_TIER ? "default" : "outline";
    if (!plan) {
      return { label: group.name, disabled: true, variant, onClick: noop };
    }
    if (plan.id === activePlanId) {
      return {
        label: isTrialing ? "Trial Active" : "Current Plan",
        disabled: true,
        variant,
        onClick: noop,
      };
    }
    return {
      label: loading === plan.id ? "Loading..." : getPricingButtonText(plan),
      disabled: loading !== null,
      variant,
      onClick: () => handleCheckout(plan.id),
    };
  }

  function renderPlanCard(group: BillingPlanGroup) {
    const plan = selectPlanVariant(group, isYearly);
    if (!plan) {
      return null;
    }
    const isCurrent = isPlanInGroup(group, activePlanId);
    const addonPlan = hasZdr ? null : findZdrAddonPlan(plans, plan.id);
    return (
      <PlanCard
        action={
          isCurrent ? (
            <Badge variant={isTrialing ? "outline" : "default"}>
              {isTrialing ? "Trial" : "Current"}
            </Badge>
          ) : undefined
        }
        addon={zdrAddonToggle(addonPlan, includeZdr, handleIncludeZdrChange)}
        button={planButton(group)}
        description={planGroupDescription(group)}
        featured={group.id === FEATURED_PLAN_TIER}
        features={getProductFeatures(plan)}
        highlighted={isCurrent}
        intervalLabel={intervalLabel}
        key={group.id}
        name={group.name}
        price={getProductPrice(plan).amount}
      />
    );
  }

  return (
    <PageContainer
      className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6"
      variant="default"
    >
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Billing & Usage
            </h1>
            {activeSubscription && (
              <Button
                disabled={portalLoading}
                onClick={handleManageSubscription}
                size="sm"
                variant="outline"
              >
                {portalLoading ? "Loading..." : "Manage Subscription"}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            Manage your plan, invoices, and feature usage
          </p>
        </div>

        <Tabs onValueChange={handleSectionChange} value={activeSection}>
          <TabsList variant="line">
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6" value="billing">
            {isBillingLoading ? (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <Skeleton className="h-96 rounded-lg" />
                  <Skeleton className="h-96 rounded-lg" />
                  <Skeleton className="h-96 rounded-lg" />
                </div>
                <Skeleton className="h-64 rounded-xl" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2
                        className="scroll-mt-24 text-lg font-semibold"
                        id={PLANS_ANCHOR}
                      >
                        Plans
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {plansDescription}
                      </p>
                    </div>
                    <Tabs
                      onValueChange={handleIntervalChange}
                      value={isYearly ? "yearly" : "monthly"}
                    >
                      <TabsList variant="line">
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger
                          className="flex items-center gap-1.5"
                          value="yearly"
                        >
                          Yearly
                          <Badge size="sm" variant="success">
                            Save 20%
                          </Badge>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    {planGroups.map(renderPlanCard)}
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Add-ons</h2>
                  <ZdrAddonCard />
                </div>

                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Invoices</h2>
                  <InvoicesTable invoices={invoices ?? []} plans={plans} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent className="mt-6" value="usage">
            <UsageSection />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <BillingPageContent />
    </Suspense>
  );
}
