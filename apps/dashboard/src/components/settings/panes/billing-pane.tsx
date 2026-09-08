"use client";

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { Badge } from "@notra/ui/components/ui/badge";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useCustomer, useListPlans } from "autumn-js/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";

import { PlanCard } from "@/components/billing/plan-card";
import { UsageSection } from "@/components/billing/usage-section";
import { ZdrAddonCard } from "@/components/billing/zdr-addon-card";
import { Button } from "@/components/button";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { SettingsPane } from "@/components/settings/settings-pane";
import { PLAN_SURFACES } from "@/constants/analytics-events";
import {
  BILLING_INVOICE_SKELETON_KEYS,
  BILLING_PLAN_FEATURE_SKELETON_KEYS,
  BILLING_PLAN_SKELETON_KEYS,
  BILLING_SECTION_VALUES,
  FEATURED_PLAN_TIER,
  INVOICE_TABLE_COLUMN_COUNT,
  PLANS_ANCHOR,
} from "@/constants/billing";
import {
  billingInterval,
  planSelectedProperties,
} from "@/lib/analytics/billing-events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { attachPlanWithAddons } from "@/lib/billing/attach-plan";
import { useHasZdrEntitlement } from "@/lib/hooks/use-plan";
import type { BillingPlanGroup, PlanCardButton } from "@/types/billing/plan";
import {
  findZdrAddonPlan,
  getInvoiceDescription,
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

const noop = () => undefined;

function BillingPlanCardSkeleton() {
  return (
    <TitleCard heading={<Skeleton className="h-5 w-24" />}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-9 w-full rounded-md" />
        <ul className="space-y-2.5 pt-2">
          {BILLING_PLAN_FEATURE_SKELETON_KEYS.map((key) => (
            <li className="flex items-center gap-2" key={key}>
              <Skeleton className="size-4 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-full" />
            </li>
          ))}
        </ul>
      </div>
    </TitleCard>
  );
}

function InvoiceTableSkeleton() {
  return (
    <div className="border-border/80 border-b-border/40 bg-muted/80 overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead className="w-[40%]">Description</TableHead>
            <TableHead className="w-[120px]">Amount</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {BILLING_INVOICE_SKELETON_KEYS.map((key) => (
            <TableRow key={key}>
              <TableCell className="w-[140px]">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell className="w-[120px]">
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell className="w-[120px]">
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BillingPaneFallback() {
  return (
    <SettingsPane>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-8 w-40 rounded-md" />
      </div>
      <BillingPlansLoading />
    </SettingsPane>
  );
}

function BillingPlansLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-52 rounded-lg" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {BILLING_PLAN_SKELETON_KEYS.map((key) => (
            <BillingPlanCardSkeleton key={key} />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <TitleCard
          action={<Skeleton className="h-5 w-14 rounded-full" />}
          heading={<Skeleton className="h-5 w-44" />}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full max-w-xl space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-8 w-32 shrink-0 rounded-md" />
          </div>
        </TitleCard>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <InvoiceTableSkeleton />
      </div>
    </div>
  );
}

function BillingSettingsPaneContent() {
  const { activeOrganization } = useOrganizationsContext();
  const { data: plans, isLoading: plansLoading } = useListPlans();
  const {
    attach,
    multiAttach,
    openCustomerPortal,
    data: customer,
    isLoading: customerLoading,
    refetch,
  } = useCustomer({
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
  const [dateSortOrder, setDateSortOrder] = useState<"asc" | "desc">("desc");
  const [now] = useState(() => Date.now());
  const invoiceListId = useId();

  const invoices = customer?.invoices;

  const sortedInvoices = useMemo(() => {
    return [...(invoices ?? [])].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateSortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [invoices, dateSortOrder]);

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
    const returnUrl = `${window.location.origin}/${activeOrganization?.slug}?settings=billing`;
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

  function renderManageSubscription() {
    if (activeSection !== "billing") {
      return null;
    }
    if (customerLoading) {
      return <Skeleton className="h-8 w-40 rounded-md" />;
    }
    if (!activeSubscription) {
      return null;
    }
    return (
      <Button
        disabled={portalLoading}
        onClick={handleManageSubscription}
        size="sm"
        variant="outline"
      >
        {portalLoading ? "Loading..." : "Manage Subscription"}
      </Button>
    );
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
    <SettingsPane>
      <Tabs onValueChange={handleSectionChange} value={activeSection}>
        <div className="flex items-center justify-between gap-3">
          <TabsList aria-label="Billing sections">
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>
          {renderManageSubscription()}
        </div>

        <TabsContent className="mt-4" value="billing">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2
                    className="scroll-mt-24 text-lg font-semibold"
                    id={PLANS_ANCHOR}
                  >
                    Plans
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {isBillingLoading
                      ? "Upgrade or change your plan."
                      : plansDescription}
                  </p>
                </div>
                <Tabs
                  onValueChange={handleIntervalChange}
                  value={isYearly ? "yearly" : "monthly"}
                >
                  <TabsList aria-label="Billing interval">
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
                {isBillingLoading
                  ? BILLING_PLAN_SKELETON_KEYS.map((key) => (
                      <BillingPlanCardSkeleton key={key} />
                    ))
                  : planGroups.map(renderPlanCard)}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Add-ons</h2>
              <ZdrAddonCard />
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Invoices</h2>
              {customerLoading ? (
                <InvoiceTableSkeleton />
              ) : (
                <div className="border-border/80 border-b-border/40 bg-muted/80 overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="hover:text-foreground w-[140px] cursor-pointer transition-colors select-none"
                          onClick={() =>
                            setDateSortOrder(
                              dateSortOrder === "desc" ? "asc" : "desc"
                            )
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            Date
                            <HugeiconsIcon
                              className="size-3.5"
                              icon={
                                dateSortOrder === "desc"
                                  ? ArrowDown01Icon
                                  : ArrowUp01Icon
                              }
                            />
                          </span>
                        </TableHead>
                        <TableHead className="w-[40%]">Description</TableHead>
                        <TableHead className="w-[120px]">Amount</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell
                            className="text-muted-foreground h-24 text-center"
                            colSpan={INVOICE_TABLE_COLUMN_COUNT}
                          >
                            No invoices yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedInvoices.map((invoice) => (
                          <TableRow
                            className={
                              invoice.hostedInvoiceUrl
                                ? "cursor-pointer"
                                : undefined
                            }
                            key={`${invoiceListId}-${invoice.createdAt}-${invoice.total}`}
                            onClick={() => {
                              if (invoice.hostedInvoiceUrl) {
                                window.open(invoice.hostedInvoiceUrl, "_blank");
                              }
                            }}
                          >
                            <TableCell className="w-[140px]">
                              {invoice.createdAt
                                ? new Date(
                                    invoice.createdAt
                                  ).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell className="wrap-break-word whitespace-normal">
                              {getInvoiceDescription(invoice.planIds, plans)}
                            </TableCell>
                            <TableCell className="w-[120px] tabular-nums">
                              {invoice.total !== undefined
                                ? `$${invoice.total.toFixed(2)}`
                                : "-"}
                            </TableCell>
                            <TableCell className="w-[120px]">
                              <Badge
                                variant={
                                  invoice.status === "paid"
                                    ? "success"
                                    : "secondary"
                                }
                              >
                                {(invoice.status ?? "pending")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (invoice.status ?? "pending").slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent className="mt-4" value="usage">
          <UsageSection />
        </TabsContent>
      </Tabs>
    </SettingsPane>
  );
}

export function BillingSettingsPane() {
  return (
    <Suspense fallback={<BillingPaneFallback />}>
      <BillingSettingsPaneContent />
    </Suspense>
  );
}
