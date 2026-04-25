import { DatabuddyWordmark } from "@notra/ui/components/ui/svgs/databuddyWordmark";
import { Inth } from "@notra/ui/components/ui/svgs/inth";
import { StackAuth } from "@notra/ui/components/ui/svgs/stack-auth";
import { Stagewise } from "@notra/ui/components/ui/svgs/stagewise";
import type { ComponentType, SVGProps } from "react";

export const SOCIAL_LINKS = {
  x: "/x",
  linkedin: "/linkedin",
  github: "/github",
  discord: "/discord",
} as const;

export const PRICING_PLANS = {
  basic: {
    name: "Basic",
    description: "For solo devs and small teams getting started.",
    pricing: { monthly: 20, annually: 200 },
    cta: {
      label: "Start 7 day free trial",
      href: "https://app.usenotra.com/signup",
    },
    features: [
      "2 team members",
      "$12 in AI Credits per month",
      "3 workflows",
      "2 integrations",
      { label: "30 references", subtitle: "then $0.05 per reference / mo" },
      "14 Days Log Retention",
    ],
  },
  pro: {
    name: "Pro",
    description: "For growing teams that need more power.",
    pricing: { monthly: 50, annually: 500 },
    cta: {
      label: "Get started",
      href: "https://app.usenotra.com/signup",
    },
    features: [
      "5 team members",
      "$32 in AI Credits per month",
      "Unlimited workflows",
      "Unlimited integrations",
      { label: "100 references", subtitle: "then $0.05 per reference / mo" },
      "30 Days Log Retention",
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
      "Dedicated Support",
    ],
  },
} as const;

const FEATURES_TABLE = [
  {
    category: "Workflows",
    items: [
      {
        name: "Workflows",
        basic: "3",
        pro: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "AI Credits",
        basic: "$12 / month",
        pro: "$32 / month",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    category: "Team",
    items: [
      {
        name: "Team members",
        basic: "2",
        pro: "5",
        enterprise: "Unlimited",
      },
      {
        name: "Integrations",
        basic: "2",
        pro: "Unlimited",
        enterprise: "Custom",
      },
      {
        name: "References",
        basic: "30",
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
        basic: "14 Days",
        pro: "30 Days",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        name: "Community support",
        basic: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Email support",
        basic: false,
        pro: true,
        enterprise: true,
      },
      {
        name: "Dedicated support",
        basic: false,
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
    name: "inth",
    Component: Inth,
    href: "https://inth.com?utm_source=notra",
    className: "h-8",
  },
  {
    name: "Databuddy",
    Component: DatabuddyWordmark,
    href: "https://databuddy.cc?utm_source=notra",
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
