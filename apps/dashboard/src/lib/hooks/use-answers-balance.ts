"use client";

import { FEATURES } from "@notra/ai/billing/features";
import { useCustomer } from "autumn-js/react";

import { useAutumnRefreshListener } from "@/lib/hooks/use-autumn-refresh-listener";

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
  } = useCustomer({
    expand: ["balances.feature", "subscriptions.plan"],
  });

  useAutumnRefreshListener(refetch);

  const answers = customer?.balances?.[FEATURES.AI_ANSWERS];
  const balance =
    typeof answers?.remaining === "number" ? answers.remaining : null;

  return { isLoading, balance };
}
