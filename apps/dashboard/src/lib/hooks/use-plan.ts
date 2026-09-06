"use client";

import { FEATURES } from "@notra/ai/billing/features";
import { useCustomer } from "autumn-js/react";

/**
 * Reads the zero data retention entitlement from Autumn. `hasZdr` is false
 * while loading; check `isLoading` before treating it as a final answer.
 */
export function useHasZdrEntitlement() {
  const { check, isLoading } = useCustomer();
  const hasZdr = check({ featureId: FEATURES.ZDR }).allowed === true;
  return { hasZdr, isLoading };
}

export function useHasAiCreditsFeature() {
  const { data: customer, isLoading } = useCustomer();
  const hasAiCredits = Boolean(customer?.balances?.[FEATURES.AI_CREDITS]);
  return { hasAiCredits, isLoading };
}

export function useHasGeoFeature() {
  const { data: customer, isLoading } = useCustomer();
  const hasGeo = Boolean(customer?.balances?.[FEATURES.AI_ANSWERS]);
  const isLocked = !isLoading && !!customer && !hasGeo;
  return { hasGeo, isLocked, isLoading };
}
