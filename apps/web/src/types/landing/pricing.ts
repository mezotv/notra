import type { ComponentType, SVGProps } from "react";

export type PricingIconKey =
  | "tracking"
  | "images"
  | "content"
  | "social"
  | "projects"
  | "references"
  | "retention"
  | "support"
  | "zdr";

export type PricingIcon = ComponentType<SVGProps<SVGSVGElement>>;

type BillingPeriod = "monthly" | "yearly";

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
  price: Record<BillingPeriod, string>;
  priceSuffix?: Record<BillingPeriod, string>;
  variant: "default" | "featured";
  cta: PricingCta;
  features: PricingFeature[];
}

export interface TrackedEngine {
  name: string;
  src: string;
  darkSrc?: string;
  width: number;
}

export interface PricingCardProps {
  plan: PricingPlan;
}

export interface LandingPricingSectionProps {
  showHeader?: boolean;
}
