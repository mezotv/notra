"use client";

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { cn } from "@notra/ui/lib/utils";
import { useCustomer, useListPlans } from "autumn-js/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { PlanCard } from "@/components/billing/plan-card";
import { UsageSection } from "@/components/billing/usage-section";
import { ZdrAddonCard } from "@/components/billing/zdr-addon-card";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  BILLING_SECTION_VALUES,
  FEATURED_PLAN_TIER,
  INVOICE_TABLE_COLUMN_COUNT,
  PLANS_ANCHOR,
} from "@/constants/billing";
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

  const invoices = customer?.invoices ?? [];

  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
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

  async function handleCheckout(planId: string) {
    setLoading(planId);
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
        addon={zdrAddonToggle(addonPlan, includeZdr, setIncludeZdr)}
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
            <h1 className="font-bold text-3xl tracking-tight">
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
                        className="scroll-mt-24 font-semibold text-lg"
                        id={PLANS_ANCHOR}
                      >
                        Plans
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {plansDescription}
                      </p>
                    </div>
                    <Tabs
                      onValueChange={(value) => setIsYearly(value === "yearly")}
                      value={isYearly ? "yearly" : "monthly"}
                    >
                      <TabsList variant="line">
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger
                          className="flex items-center gap-1.5"
                          value="yearly"
                        >
                          Yearly
                          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-medium text-[10px] text-emerald-600">
                            Save 20%
                          </span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    {planGroups.map(renderPlanCard)}
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="font-semibold text-lg">Add-ons</h2>
                  <ZdrAddonCard />
                </div>

                <div className="space-y-3">
                  <h2 className="font-semibold text-lg">Invoices</h2>
                  <div className="overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-muted/80 shadow-2xs">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="w-[140px] cursor-pointer select-none transition-colors hover:text-foreground"
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
                              className="h-24 text-center text-muted-foreground"
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
                                  window.open(
                                    invoice.hostedInvoiceUrl,
                                    "_blank"
                                  );
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
                                  className={cn(
                                    invoice.status === "paid" &&
                                      "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15"
                                  )}
                                  variant={
                                    invoice.status === "paid"
                                      ? "default"
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
