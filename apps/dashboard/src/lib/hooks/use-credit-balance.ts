"use client";

import { FEATURES } from "@notra/ai/billing/features";
import { useCustomer } from "autumn-js/react";

export function useCreditBalance() {
  const { data: customer, isLoading } = useCustomer({
    expand: ["balances.feature", "subscriptions.plan"],
  });

  const hasActiveSubscription =
    customer?.subscriptions?.some(
      (sub) => !sub.addOn && sub.status === "active"
    ) ?? false;

  const aiCredits = customer?.balances?.[FEATURES.AI_CREDITS];
  const balance =
    typeof aiCredits?.remaining === "number" ? aiCredits.remaining : null;

  return { isLoading, hasActiveSubscription, balance };
}
