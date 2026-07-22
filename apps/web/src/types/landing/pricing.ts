import type { ComponentType, SVGProps } from "react";

export type PricingIconKey =
  | "team"
  | "credits"
  | "workflows"
  | "integrations"
  | "references"
  | "retention"
  | "support";

export type PricingIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type BillingPeriod = "monthly" | "yearly";

export interface BillingToggleOption {
  value: BillingPeriod;
  label: string;
}

interface PricingFeature {
  label: string;
  subtitle?: string;
  icon: PricingIconKey;
}

type PricingCtaKind = "signup" | "mail";

interface PricingCta {
  label: string;
  kind: PricingCtaKind;
  href: string;
  source: string;
  showArrow: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  priceSuffix?: string;
  variant: "default" | "featured";
  hasAnnualBadge?: boolean;
  cta: PricingCta;
  features: PricingFeature[];
}

export interface PricingCardProps {
  plan: PricingPlan;
  billingPeriod: BillingPeriod;
}

export interface PricingBillingToggleProps {
  value: BillingPeriod;
  onValueChange: (value: BillingPeriod) => void;
}

export interface LandingPricingSectionProps {
  showHeader?: boolean;
}
