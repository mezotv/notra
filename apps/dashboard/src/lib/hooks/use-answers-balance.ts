"use client";

import { FEATURES } from "@notra/ai/billing/features";

import { useAutumnRefreshListener } from "@/lib/hooks/use-autumn-refresh-listener";
import { useBillingCustomer } from "@/lib/hooks/use-billing-customer";

/**
 * Reads the remaining AI answers (GEO scan quota) from Autumn.
 * `balance` is null while loading or when unknown; check `isLoading`
 * before treating it as a final answer.
 */
export function useAnswersBalance() {
  const {
    data: customer,
    isLoading,
    refetch,
  } = useBillingCustomer({
    expand: ["balances.feature", "subscriptions.plan"],
  });

  useAutumnRefreshListener(refetch);

  const answers = customer?.balances?.[FEATURES.AI_ANSWERS];
  const balance =
    typeof answers?.remaining === "number" ? answers.remaining : null;

  return { isLoading, balance };
}
