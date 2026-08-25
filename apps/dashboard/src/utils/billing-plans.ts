import { ACTIVE_PAID_PLAN_IDS, FEATURES } from "@notra/ai/billing/features";
import {
  ANNUAL_ADDON_SUFFIX,
  ANNUAL_PLAN_SUFFIXES,
  BILLING_PRICE_REGEX,
  BILLING_SCENARIO_TEXT,
  INVOICE_PRODUCT_NAME_FALLBACKS,
  LEGACY_PLAN_TIERS,
  PLAN_NAME_BILLING_INTERVAL_SUFFIX,
  PLAN_TIER_DESCRIPTIONS,
  ZDR_ADDON_BY_TIER,
  ZDR_ADDON_HINT,
  ZDR_ADDON_PREFIX,
  ZDR_ADDON_TITLE,
} from "@/constants/billing";
import type {
  BillingPlan,
  BillingPlanGroup,
  BillingPlanPrice,
  BillingSubscription,
  PlanCardAddon,
} from "@/types/billing/plan";
import type { ProductFeature } from "@/types/hooks/billing";

const MONTHS_PER_YEAR = 12;

export function isAnnualPlanId(planId: string | undefined): boolean {
  if (!planId) {
    return false;
  }
  return ANNUAL_PLAN_SUFFIXES.some((suffix) => planId.endsWith(suffix));
}

export function planTierId(planId: string | undefined): string | null {
  if (!planId) {
    return null;
  }
  const legacyTier = LEGACY_PLAN_TIERS[planId];
  if (legacyTier) {
    return legacyTier;
  }
  for (const suffix of ANNUAL_PLAN_SUFFIXES) {
    if (planId.endsWith(suffix)) {
      return planId.slice(0, -suffix.length);
    }
  }
  return planId;
}

export function planDisplayName(
  name: string | null | undefined
): string | null {
  if (!name) {
    return null;
  }
  return name.replace(PLAN_NAME_BILLING_INTERVAL_SUFFIX, "");
}

export function getProductPrice(
  plan: BillingPlan | null | undefined
): BillingPlanPrice {
  if (!plan?.price) {
    return { amount: 0, interval: "month" };
  }
  return {
    amount: plan.price.amount,
    interval: plan.price.interval ?? "month",
  };
}

export function getProductFeatures(
  plan: BillingPlan | null | undefined
): ProductFeature[] {
  if (!plan?.items) {
    return [];
  }

  return plan.items
    .map((item): ProductFeature | null => {
      const displayText = item.display?.primaryText ?? "";
      if (
        displayText.startsWith("$") ||
        BILLING_PRICE_REGEX.test(displayText)
      ) {
        return null;
      }

      const overageText = item.display?.secondaryText;

      if (item.featureId === FEATURES.AI_CREDITS) {
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
    .filter((feature): feature is ProductFeature => feature !== null);
}

export function getPricingButtonText(plan: BillingPlan): string {
  const attachAction = plan.customerEligibility?.attachAction;

  if (plan.freeTrial && plan.customerEligibility?.trialAvailable) {
    return "Start Free Trial";
  }
  if (attachAction === "purchase") {
    return "Purchase";
  }

  return BILLING_SCENARIO_TEXT[attachAction ?? ""] ?? "Get Started";
}

function monthlyEquivalent(group: BillingPlanGroup): number {
  if (group.monthly) {
    return getProductPrice(group.monthly).amount;
  }
  if (group.annual) {
    return getProductPrice(group.annual).amount / MONTHS_PER_YEAR;
  }
  return 0;
}

export function groupBillingPlans(
  plans: BillingPlan[] | undefined
): BillingPlanGroup[] {
  const groups = new Map<string, BillingPlanGroup>();

  for (const plan of plans ?? []) {
    if (
      plan.addOn ||
      plan.archived ||
      !plan.price ||
      !ACTIVE_PAID_PLAN_IDS.has(plan.id)
    ) {
      continue;
    }
    const id = planTierId(plan.id) ?? plan.id;
    const group = groups.get(id) ?? {
      id,
      name: planDisplayName(plan.name) ?? id,
      description: plan.description ?? null,
      monthly: null,
      annual: null,
    };
    if (plan.price.interval === "year") {
      group.annual = plan;
    } else {
      group.monthly = plan;
      group.name = planDisplayName(plan.name) ?? group.name;
      group.description = plan.description ?? group.description;
    }
    groups.set(id, group);
  }

  return [...groups.values()].sort(
    (a, b) => monthlyEquivalent(a) - monthlyEquivalent(b)
  );
}

export function selectPlanVariant(
  group: BillingPlanGroup,
  isYearly: boolean
): BillingPlan | null {
  if (isYearly) {
    return group.annual;
  }
  return group.monthly;
}

export function planGroupDescription(group: BillingPlanGroup): string {
  return group.description ?? PLAN_TIER_DESCRIPTIONS[group.id] ?? "";
}

export function isPlanInGroup(
  group: BillingPlanGroup,
  planId: string | undefined
): boolean {
  if (!planId) {
    return false;
  }
  return group.monthly?.id === planId || group.annual?.id === planId;
}

export function nextPlanGroup(
  groups: BillingPlanGroup[],
  activePlanId: string | undefined
): BillingPlanGroup | null {
  if (!activePlanId) {
    return groups[0] ?? null;
  }
  const tier = planTierId(activePlanId);
  const index = groups.findIndex((group) => group.id === tier);
  if (index === -1) {
    return null;
  }
  return groups[index + 1] ?? null;
}

export function planCardClassName(
  highlighted: boolean,
  featured: boolean
): string {
  if (highlighted) {
    return "ring-2 ring-primary";
  }
  if (featured) {
    return "ring-2 ring-primary/50 transition-all hover:ring-primary/80";
  }
  return "transition-all hover:ring-2 hover:ring-muted-foreground/20";
}

export function formatInvoiceProductName(
  productId: string,
  plans: BillingPlan[] | undefined
): string {
  const plan = plans?.find((entry) => entry.id === productId);
  return (
    planDisplayName(plan?.name) ??
    INVOICE_PRODUCT_NAME_FALLBACKS[productId] ??
    productId
  );
}

export function getInvoiceDescription(
  productIds: string[] | undefined,
  plans: BillingPlan[] | undefined
): string {
  if (!productIds?.length) {
    return "Subscription";
  }
  return productIds
    .map((productId) => formatInvoiceProductName(productId, plans))
    .join(", ");
}

export function zdrAddonPlanId(
  activePlanId: string | undefined
): string | null {
  const tier = planTierId(activePlanId);
  const base = tier ? ZDR_ADDON_BY_TIER[tier] : undefined;
  if (!base) {
    return null;
  }
  return isAnnualPlanId(activePlanId) ? `${base}${ANNUAL_ADDON_SUFFIX}` : base;
}

export function isZdrAddonPlanId(planId: string | undefined): boolean {
  return Boolean(planId?.startsWith(ZDR_ADDON_PREFIX));
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function findZdrAddonPlan(
  plans: BillingPlan[] | undefined,
  planId: string | undefined
): BillingPlan | null {
  const addonId = zdrAddonPlanId(planId);
  if (!addonId) {
    return null;
  }
  return plans?.find((plan) => plan.id === addonId) ?? null;
}

export function zdrAddonToggle(
  addonPlan: BillingPlan | null,
  checked: boolean,
  onCheckedChange: (checked: boolean) => void
): PlanCardAddon | undefined {
  if (!addonPlan) {
    return undefined;
  }
  const price = getProductPrice(addonPlan);
  return {
    label: ZDR_ADDON_TITLE,
    description: `+${formatUsd(price.amount)}/${price.interval}`,
    hint: ZDR_ADDON_HINT,
    checked,
    onCheckedChange,
  };
}

export function findActivePlanSubscription(
  subscriptions: BillingSubscription[] | undefined
): BillingSubscription | undefined {
  return subscriptions?.find(
    (subscription) => !subscription.addOn && subscription.status === "active"
  );
}

export function findZdrSubscription(
  subscriptions: BillingSubscription[] | undefined
): BillingSubscription | undefined {
  return subscriptions?.find(
    (subscription) =>
      subscription.addOn &&
      subscription.status === "active" &&
      isZdrAddonPlanId(subscription.planId)
  );
}
