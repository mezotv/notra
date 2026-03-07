import { Consent } from "@notra/ui/components/ui/svgs/consent";
import { StackAuth } from "@notra/ui/components/ui/svgs/stack-auth";
import { Stagewise } from "@notra/ui/components/ui/svgs/stagewise";
import { Upstash } from "@notra/ui/components/ui/svgs/upstash";
import type { ComponentType, SVGProps } from "react";

export const SOCIAL_LINKS = {
  x: "/x",
  linkedin: "/linkedin",
  github: "/github",
  discord: "/discord",
} as const;

export const PRICING_PLANS = {
  free: {
    name: "Free",
    description: "For solo devs and small teams getting started.",
    pricing: { monthly: 0, annually: 0 },
    cta: { label: "Start for free", href: "https://app.usenotra.com/signup" },
    features: [
      "2 team members",
      "15 AI Credits per month",
      "3 workflows",
      "2 integrations",
      "30 references",
      "7 Days Log Retention",
    ],
  },
  pro: {
    name: "Pro",
    description: "For growing teams that need more power.",
    pricing: { monthly: 29, annually: 24 },
    cta: {
      label: "Start 7-day trial",
      href: "https://app.usenotra.com/signup",
    },
    features: [
      "10 team members",
      "500 AI Credits per month",
      "10 workflows",
      "5 integrations",
      "100 references",
      "30 Days Log Retention",
      "Analytics",
    ],
  },
  enterprise: {
    name: "Enterprise",
    description: "For large teams with custom needs.",
    pricing: { monthly: null, annually: null },
    cta: { label: "Contact us", href: "mailto:hello@usenotra.com" },
    features: [
      "Unlimited team members",
      "Unlimited AI Credits",
      "Unlimited workflows",
      "Custom integrations",
      "Unlimited references",
      "Unlimited Log Retention",
      "Advanced Analytics",
      "Dedicated Support",
    ],
  },
} as const;

export const FEATURES_TABLE = [
  {
    category: "Workflows",
    items: [
      { name: "Workflows", free: "3", pro: "10", enterprise: "Unlimited" },
      {
        name: "AI Credits",
        free: "15 / month",
        pro: "500 / month",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    category: "Team",
    items: [
      {
        name: "Team members",
        free: "2",
        pro: "10",
        enterprise: "Unlimited",
      },
      {
        name: "Integrations",
        free: "2",
        pro: "5",
        enterprise: "Custom",
      },
      {
        name: "References",
        free: "30",
        pro: "100",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    category: "Data",
    items: [
      {
        name: "Log retention",
        free: "7 Days",
        pro: "30 Days",
        enterprise: "Unlimited",
      },
      {
        name: "Analytics",
        free: false,
        pro: true,
        enterprise: true,
      },
      {
        name: "Advanced analytics",
        free: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        name: "Community support",
        free: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Email support",
        free: false,
        pro: true,
        enterprise: true,
      },
      {
        name: "Dedicated support",
        free: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
] as const;

export const COMPARISON_FEATURES = FEATURES_TABLE.map(
  ({ category, items }) => ({
    category,
    features: items,
  })
);

export const SOCIAL_PROOF_LOGOS: {
  name: string;
  Component: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  className?: string;
}[] = [
  {
    name: "Consent",
    Component: Consent,
    href: "https://consent.io?utm_source=notra",
    className: "h-6",
  },
  {
    name: "Upstash",
    Component: Upstash,
    href: "https://upstash.com?utm_source=notra",
    className: "h-8",
  },
  {
    name: "stagewise",
    Component: Stagewise,
    href: "https://stagewise.io?utm_source=notra",
    className: "h-8",
  },
  {
    name: "Stack Auth",
    Component: StackAuth,
    href: "https://stack-auth.com?utm_source=notra",
    className: "h-8",
  },
];
