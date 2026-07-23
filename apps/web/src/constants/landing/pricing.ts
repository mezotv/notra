import type {
  BillingPeriod,
  BillingToggleOption,
  PricingPlan,
} from "@/types/landing/pricing";

export const PRICING_HEADING = "Simple pricing that scales with what you ship.";

export const PRICING_SUBHEADING =
  "Start with a 3-day free trial. Upgrade when you need more seats, integrations or references - cancel anytime.";

export const PRICING_ANNUAL_BADGE = "2 months free";

export const PRICING_DEFAULT_BILLING: BillingPeriod = "yearly";

export const PRICING_BILLING_OPTIONS: BillingToggleOption[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const SIGNUP_URL = "https://app.usenotra.com/signup";
const ENTERPRISE_MAIL_URL = "mailto:hello@usenotra.com";
const REFERENCE_OVERAGE_SUBTITLE = "then $0.05 per ref / mo";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "For small teams publishing their first regular updates.",
    price: { monthly: "$20", yearly: "$200" },
    priceSuffix: { monthly: "/monthly", yearly: "/yearly" },
    variant: "default",
    hasAnnualBadge: true,
    cta: {
      label: "Start a 3-day free trial",
      kind: "signup",
      href: SIGNUP_URL,
      source: "pricing_basic",
      showArrow: true,
    },
    features: [
      { label: "2 Team members", icon: "team" },
      { label: "$12 in AI credits per month", icon: "credits" },
      { label: "3 Workflows", icon: "workflows" },
      { label: "2 Integrations", icon: "integrations" },
      {
        label: "30 references",
        subtitle: REFERENCE_OVERAGE_SUBTITLE,
        icon: "references",
      },
      { label: "14 Days log retention", icon: "retention" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description:
      "For teams shipping every week who want every release covered.",
    price: { monthly: "$50", yearly: "$500" },
    priceSuffix: { monthly: "/monthly", yearly: "/yearly" },
    variant: "featured",
    hasAnnualBadge: true,
    cta: {
      label: "Get Started",
      kind: "signup",
      href: SIGNUP_URL,
      source: "pricing_pro",
      showArrow: true,
    },
    features: [
      { label: "5 Team members", icon: "team" },
      { label: "$32 in AI credits per month", icon: "credits" },
      { label: "Unlimited Workflows", icon: "workflows" },
      { label: "Unlimited Integrations", icon: "integrations" },
      {
        label: "100 references",
        subtitle: REFERENCE_OVERAGE_SUBTITLE,
        icon: "references",
      },
      { label: "30 Days log retention", icon: "retention" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large teams with custom needs.",
    price: { monthly: "Custom", yearly: "Custom" },
    variant: "default",
    cta: {
      label: "Contact Us",
      kind: "mail",
      href: ENTERPRISE_MAIL_URL,
      source: "pricing_enterprise",
      showArrow: false,
    },
    features: [
      { label: "Unlimited Team Members", icon: "team" },
      { label: "Unlimited AI Credits", icon: "credits" },
      { label: "Unlimited Workflows", icon: "workflows" },
      { label: "Unlimited Integrations", icon: "integrations" },
      { label: "Unlimited References", icon: "references" },
      { label: "Unlimited Log Retention", icon: "retention" },
      { label: "Dedicated Support", icon: "support" },
    ],
  },
];
