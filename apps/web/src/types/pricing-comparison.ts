type PricingComparisonValue = boolean | string;

type PricingComparisonPlanKey = "starter" | "pro" | "scale" | "enterprise";

export interface PricingComparisonPlan {
  key: PricingComparisonPlanKey;
  name: string;
  isFeatured: boolean;
}

export interface PricingCellValueProps {
  value: PricingComparisonValue;
}
