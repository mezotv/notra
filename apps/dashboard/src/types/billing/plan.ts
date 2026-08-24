import type { useListPlans } from "autumn-js/react";
import type { ReactNode } from "react";
import type { ProductFeature } from "@/types/hooks/billing";

export type BillingPlan = Exclude<
  ReturnType<typeof useListPlans>["data"],
  undefined
>[number];

export interface BillingPlanGroup {
  id: string;
  name: string;
  description: string | null;
  monthly: BillingPlan | null;
  annual: BillingPlan | null;
}

export interface BillingPlanPrice {
  amount: number;
  interval: string;
}

export interface PlanCardButton {
  label: string;
  disabled: boolean;
  variant: "default" | "outline";
  onClick: () => void;
}

export interface PlanCardProps {
  name: string;
  description: string;
  price: number;
  intervalLabel: string;
  features: ProductFeature[];
  featured: boolean;
  highlighted: boolean;
  action?: ReactNode;
  button: PlanCardButton;
}
