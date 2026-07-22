type PricingComparisonValue = boolean | string;

type PricingComparisonPlanKey = "basic" | "pro" | "enterprise";

export interface PricingComparisonPlan {
  key: PricingComparisonPlanKey;
  name: string;
  isFeatured: boolean;
}

export interface PricingCellValueProps {
  value: PricingComparisonValue;
}
