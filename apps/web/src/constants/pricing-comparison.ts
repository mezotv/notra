import type { PricingComparisonPlan } from "@/types/pricing-comparison";
import { PRICING_PLANS } from "@/utils/constants";

export const PRICING_COMPARISON_PLANS: PricingComparisonPlan[] = [
  { key: "basic", name: PRICING_PLANS.basic.name, isFeatured: false },
  { key: "pro", name: PRICING_PLANS.pro.name, isFeatured: true },
  { key: "enterprise", name: PRICING_PLANS.enterprise.name, isFeatured: false },
];
