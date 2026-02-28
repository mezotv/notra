export const SOCIAL_LINKS = {
  x: "https://x.com/usenotra",
  linkedin: "https://www.linkedin.com/company/usenotra",
  github: "https://github.com/usenotra/notra",
  discord: "https://discord.gg/2qzGZDsnwB",
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
      "7 Days Log Retention",
    ],
  },
  pro: {
    name: "Pro",
    description: "More power for growing teams.",
    pricing: { monthly: 50, annually: 500 },
    cta: { label: "Get started", href: "https://app.usenotra.com/signup" },
    features: [
      "5 team members",
      "Unlimited workflows",
      "Unlimited integrations",
      "30 Days Log Retention",
      "200 AI Credits (then $0.01/credit)",
    ],
  },
  enterprise: {
    name: "Enterprise",
    description: "Full control for large teams with custom workflows.",
    cta: { label: "Contact us", href: "mailto:dominik@usenotra.com" },
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Custom integrations",
      "Unlimited log retention",
      "Dedicated support",
      "Custom AI Credit limits",
    ],
  },
} as const;

export const COMPARISON_FEATURES = [
  {
    category: "Usage",
    features: [
      {
        name: "Team members",
        free: "2",
        pro: "5",
        enterprise: "Unlimited",
      },
      {
        name: "Workflows",
        free: "3",
        pro: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "Integrations",
        free: "2",
        pro: "Unlimited",
        enterprise: "Custom",
      },
      {
        name: "AI Credits per month",
        free: "15",
        pro: "200 (then $0.01/credit)",
        enterprise: "Custom limits",
      },
      {
        name: "Log retention",
        free: "7 days",
        pro: "30 days",
        enterprise: "Unlimited",
      },
    ],
  },
  {
    category: "Support",
    features: [
      {
        name: "Community support",
        free: true,
        pro: true,
        enterprise: true,
      },
      {
        name: "Priority support",
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

export const SOCIAL_PROOF_LOGOS = [
  {
    name: "Consent",
    type: "wordmark" as const,
    src: "/logos/brands/consent.svg",
    href: "https://consent.io?utm_source=notra",
  },
  {
    name: "Upstash",
    type: "wordmark" as const,
    src: "/logos/brands/upstash.svg",
    href: "https://upstash.com?utm_source=notra",
  },
  {
    name: "DataBuddy",
    type: "icon" as const,
    src: "/logos/brands/databuddy.svg",
    href: "https://databuddy.cc?utm_source=notra",
  },
  {
    name: "Stack Auth",
    type: "wordmark" as const,
    src: "/logos/brands/stack-auth.svg",
    href: "https://stack-auth.com?utm_source=notra",
  },
];
