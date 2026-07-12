const STRIPE_EVALUATION_COMPANY = {
  domain: "stripe.com",
  organizationId: "OPCplumQX6Ca9p2fqF2ubEHboxybPXiJ",
  organizationName: "Stripe",
  organizationSlug: "stripe",
} as const;

export const ONBOARDING_EVALUATION_COMPANIES = [
  {
    domain: "mintlify.com",
    organizationId: "eval_mintlify_20260712",
    organizationName: "Mintlify evaluation",
    organizationSlug: "agent-eval-mintlify",
  },
  {
    domain: "context.dev",
    organizationId: "sMX3CiKFiQM3BVudPe3KRYDbXwEo78bA",
    organizationName: "Context.dev",
    organizationSlug: "contextdev",
  },
  STRIPE_EVALUATION_COMPANY,
] as const;

export const ONBOARDING_EVALUATION_SKILL_SOURCE_ORGANIZATION_ID =
  STRIPE_EVALUATION_COMPANY.organizationId;
