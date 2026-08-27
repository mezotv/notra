"use client";

import { FEATURES } from "@notra/ai/billing/features";
import { useCustomer } from "autumn-js/react";

import { useAutumnRefreshListener } from "@/lib/hooks/use-autumn-refresh-listener";

export function useCreditBalance() {
  const {
    data: customer,
    isLoading,
    refetch,
  } = useCustomer({
    expand: ["balances.feature", "subscriptions.plan"],
  });

  useAutumnRefreshListener(refetch);

  const hasActiveSubscription =
    customer?.subscriptions?.some(
      (sub) => !sub.addOn && sub.status === "active"
    ) ?? false;

  const aiCredits = customer?.balances?.[FEATURES.AI_CREDITS];
  const balance =
    typeof aiCredits?.remaining === "number" ? aiCredits.remaining : null;

  return { isLoading, hasActiveSubscription, balance };
}
