"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Counter from "@notra/ui/components/Counter";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { cn } from "@notra/ui/lib/utils";
import { useCustomer, useListPlans } from "autumn-js/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { UsageSection } from "@/components/billing/usage-section";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { FEATURES } from "@/constants/features";
import type { ProductFeature } from "@/types/hooks/billing";

const BILLING_SECTION_VALUES = ["billing", "usage"] as const;

const PRICE_REGEX = /^\d+([.,]\d+)?$/;

const SCENARIO_TEXT: Record<string, string> = {
  scheduled: "Plan Scheduled",
  active: "Current Plan",
  renew: "Renew",
  upgrade: "Upgrade",
  new: "Get Started",
  downgrade: "Downgrade",
  cancel: "Cancel Plan",
};

const INVOICE_PRODUCT_NAME_MAP: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  basic_yearly: "Basic",
  pro: "Pro",
  pro_yearly: "Pro",
  ai_credits_top_up: "AI Credits Top-up",
};

const INVOICE_TABLE_COLUMN_COUNT = 4;

type BillingPlan = Exclude<
  ReturnType<typeof useListPlans>["data"],
  undefined
>[number];

function formatInvoiceProductName(productId: string): string {
  return INVOICE_PRODUCT_NAME_MAP[productId] ?? productId;
}

function getInvoiceDescription(productIds?: string[]): string {
  if (!productIds?.length) {
    return "Subscription";
  }

  return productIds.map(formatInvoiceProductName).join(", ");
}

function getPricingButtonText(plan: BillingPlan): string {
  const attachAction = plan.customerEligibility?.attachAction;

  if (plan.freeTrial && plan.customerEligibility?.trialAvailable) {
    return "Start Free Trial";
  }
  if (attachAction === "purchase") {
    return "Purchase";
  }

  return SCENARIO_TEXT[attachAction ?? ""] ?? "Get Started";
}

function getProductPrice(plan: BillingPlan): {
  amount: number;
  interval: string;
} {
  if (!plan.price) {
    return { amount: 0, interval: "month" };
  }

  return {
    amount: plan.price.amount,
    interval: plan.price.interval ?? "month",
  };
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

      const isAiCredits = item.featureId === FEATURES.AI_CREDITS;

      if (isAiCredits) {
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

export default function BillingPage() {
  const { activeOrganization } = useOrganizationsContext();
  const { data: plans, isLoading: plansLoading } = useListPlans();
  const {
    attach,
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
  const [dateSortOrder, setDateSortOrder] = useState<"asc" | "desc">("desc");
  const invoiceListId = useId();
  const freeFeatureListId = useId();
  const proFeatureListId = useId();

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
    if (activePlanId === "pro_yearly" || activePlanId === "basic_yearly") {
      setIsYearly(true);
    } else if (activePlanId === "pro" || activePlanId === "basic") {
      setIsYearly(false);
    }
  }, [activePlanId]);

  const isBasic = activePlanId === "basic" || activePlanId === "basic_yearly";
  const isPro = activePlanId === "pro" || activePlanId === "pro_yearly";
  const isTrialing =
    activeSubscription?.trialEndsAt != null &&
    activeSubscription.trialEndsAt > Date.now();

  async function handleCheckout(planId: string) {
    setLoading(planId);
    try {
      const successUrl = activeOrganization?.slug
        ? `${window.location.origin}/${activeOrganization.slug}/settings/billing/success`
        : undefined;

      const result = await attach({
        planId,
        redirectMode: "if_required",
        successUrl,
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
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
    } finally {
      setLoading(null);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      await openCustomerPortal({
        returnUrl: `${window.location.origin}/${activeOrganization?.slug}/settings/billing`,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not open billing portal. Please try again."
      );
    } finally {
      setPortalLoading(false);
    }
  }

  const isBillingLoading = plansLoading || customerLoading;

  const basicMonthlyPlan = plans?.find((plan) => plan.id === "basic");
  const basicYearlyPlan = plans?.find((plan) => plan.id === "basic_yearly");
  const basicPlan = isYearly
    ? (basicYearlyPlan ?? basicMonthlyPlan)
    : basicMonthlyPlan;
  const basicPrice = basicPlan
    ? getProductPrice(basicPlan)
    : { amount: 0, interval: isYearly ? "year" : "month" };

  const proMonthlyPlan = plans?.find((plan) => plan.id === "pro");
  const proYearlyPlan = plans?.find((plan) => plan.id === "pro_yearly");
  const proPlan = isYearly ? proYearlyPlan : proMonthlyPlan;
  const proPrice = proPlan
    ? getProductPrice(proPlan)
    : { amount: 0, interval: isYearly ? "year" : "month" };

  const basicFeatures = getProductFeatures(basicPlan);
  const proFeatures = getProductFeatures(proPlan);

  function handleSectionChange(value: string) {
    setActiveSection(value === "usage" ? "usage" : "billing");
  }

  function renderBasicPlanButton() {
    if (basicPlan && isBasic) {
      return (
        <Button className="w-full" disabled variant="outline">
          {isTrialing ? "Trial Active" : "Current Plan"}
        </Button>
      );
    }

    if (basicPlan) {
      return (
        <Button
          className="w-full"
          disabled={loading !== null}
          onClick={() => handleCheckout(basicPlan.id)}
          variant="outline"
        >
          {loading === basicPlan.id
            ? "Loading..."
            : getPricingButtonText(basicPlan)}
        </Button>
      );
    }

    return (
      <Button className="w-full" disabled variant="outline">
        Basic
      </Button>
    );
  }

  function renderProPlanButton() {
    if (proPlan && isPro) {
      return (
        <Button className="w-full" disabled>
          {isTrialing ? "Trial Active" : "Current Plan"}
        </Button>
      );
    }

    if (proPlan) {
      const proButtonText = isBasic ? "Upgrade" : getPricingButtonText(proPlan);
      return (
        <Button
          className="w-full"
          disabled={loading !== null}
          onClick={() => handleCheckout(proPlan.id)}
        >
          {loading === proPlan.id ? "Loading..." : proButtonText}
        </Button>
      );
    }

    return (
      <Button className="w-full" disabled>
        Upgrade to Pro
      </Button>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
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
                <div className="grid gap-6 lg:grid-cols-2">
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
                      <h2 className="font-semibold text-lg">Plans</h2>
                      <p className="text-muted-foreground text-sm">
                        Upgrade or change your plan. Basic includes a 3 day free
                        trial
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

                  <div className="grid gap-6 lg:grid-cols-2">
                    <TitleCard
                      action={
                        <div className="flex items-center gap-2">
                          {isBasic && (
                            <Badge variant={isTrialing ? "outline" : "default"}>
                              {isTrialing ? "Trial" : "Current"}
                            </Badge>
                          )}
                        </div>
                      }
                      className={cn(
                        isBasic && "ring-2 ring-primary",
                        !isBasic &&
                          basicPlan &&
                          "transition-all hover:ring-2 hover:ring-muted-foreground/20"
                      )}
                      heading="Basic"
                    >
                      <div className="space-y-4">
                        <div>
                          <p className="text-muted-foreground text-sm">
                            {basicPlan?.description ??
                              "For solo devs and small teams"}
                          </p>
                          <div className="mt-2 flex items-end">
                            <span className="font-bold text-3xl leading-none">
                              $
                            </span>
                            <Counter
                              fontSize={30}
                              fontWeight={700}
                              gap={0}
                              gradientHeight={0}
                              padding={0}
                              value={basicPrice.amount}
                            />
                            <span className="mb-0.5 ml-1 font-normal text-muted-foreground text-sm">
                              /{isYearly ? "year" : "month"}
                            </span>
                          </div>
                        </div>

                        {renderBasicPlanButton()}

                        <ul className="space-y-2.5 pt-2">
                          {basicFeatures.map((feature) => (
                            <li
                              className="flex items-start gap-2 text-sm"
                              key={`${freeFeatureListId}-${feature.text}`}
                            >
                              <HugeiconsIcon
                                className="mt-0.5 size-4 shrink-0 text-emerald-500"
                                icon={CheckmarkCircle02Icon}
                              />
                              <div>
                                <span>{feature.text}</span>
                                {feature.overageText &&
                                  (feature.overageTooltip ? (
                                    <Tooltip>
                                      <TooltipTrigger
                                        className="cursor-help border-muted-foreground/30 border-b border-dashed text-muted-foreground text-xs"
                                        render={<p />}
                                      >
                                        {feature.overageText}
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[14rem]">
                                        {feature.overageTooltip}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <p className="text-muted-foreground text-xs">
                                      {feature.overageText}
                                    </p>
                                  ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TitleCard>

                    <TitleCard
                      action={
                        <div className="flex items-center gap-2">
                          {isPro && (
                            <Badge variant={isTrialing ? "outline" : "default"}>
                              {isTrialing ? "Trial" : "Current"}
                            </Badge>
                          )}
                        </div>
                      }
                      className={cn(
                        isPro && "ring-2 ring-primary",
                        !isPro &&
                          proPlan &&
                          "transition-all hover:ring-2 hover:ring-primary/50"
                      )}
                      heading="Pro"
                    >
                      <div className="space-y-4">
                        <div>
                          <p className="text-muted-foreground text-sm">
                            {proPlan?.description ?? "For Small Teams"}
                          </p>
                          <div className="mt-2 flex items-end">
                            <span className="font-bold text-3xl leading-none">
                              $
                            </span>
                            <Counter
                              fontSize={30}
                              fontWeight={700}
                              gap={0}
                              gradientHeight={0}
                              padding={0}
                              value={proPrice.amount}
                            />
                            <span className="mb-0.5 ml-1 font-normal text-muted-foreground text-sm">
                              /{isYearly ? "year" : "month"}
                            </span>
                          </div>
                        </div>

                        {renderProPlanButton()}

                        <ul className="space-y-2.5 pt-2">
                          {proFeatures.map((feature) => (
                            <li
                              className="flex items-start gap-2 text-sm"
                              key={`${proFeatureListId}-${feature.text}`}
                            >
                              <HugeiconsIcon
                                className="mt-0.5 size-4 shrink-0 text-emerald-500"
                                icon={CheckmarkCircle02Icon}
                              />
                              <div>
                                <span>{feature.text}</span>
                                {feature.overageText &&
                                  (feature.overageTooltip ? (
                                    <Tooltip>
                                      <TooltipTrigger
                                        className="cursor-help border-muted-foreground/30 border-b border-dashed text-muted-foreground text-xs"
                                        render={<p />}
                                      >
                                        {feature.overageText}
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[14rem]">
                                        {feature.overageTooltip}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <p className="text-muted-foreground text-xs">
                                      {feature.overageText}
                                    </p>
                                  ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </TitleCard>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="font-semibold text-lg">Invoices</h2>
                  <div className="overflow-hidden rounded-lg border">
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
                              className={cn(
                                invoice.hostedInvoiceUrl &&
                                  "cursor-pointer transition-colors hover:bg-muted/50"
                              )}
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
                                {getInvoiceDescription(invoice.planIds)}
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
