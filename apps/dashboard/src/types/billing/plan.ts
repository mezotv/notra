import type { useListPlans } from "autumn-js/react";

export type BillingPlan = Exclude<
  ReturnType<typeof useListPlans>["data"],
  undefined
>[number];
