import { parseAsString, parseAsStringLiteral } from "nuqs";
import { sessionStorageKeys } from "@/constants/storage";
import { marketingAttributionUrlKeys } from "./marketing-attribution-keys";

export const MARKETING_ATTRIBUTION_STORAGE_KEY =
  sessionStorageKeys.marketingAttribution;

export const marketingAttributionSearchParams = {
  dbLandingPageH1Copy: parseAsString,
  dbLandingPageH1Variant: parseAsString,
  dbSource: parseAsString,
  signupMethod: parseAsStringLiteral(["email", "google", "github"]),
};

export interface MarketingAttribution {
  source?: string;
  landingPageH1Variant?: string;
  landingPageH1Copy?: string;
  signupMethod?: "email" | "google" | "github";
  signupCompletedTracked?: boolean;
}

interface MarketingAttributionValues {
  source?: string | null;
  landingPageH1Variant?: string | null;
  landingPageH1Copy?: string | null;
  signupMethod?: string | null;
}

export function readMarketingAttributionFromValues(
  values: MarketingAttributionValues
): MarketingAttribution {
  return {
    source: values.source ?? undefined,
    landingPageH1Variant: values.landingPageH1Variant ?? undefined,
    landingPageH1Copy: values.landingPageH1Copy ?? undefined,
    signupMethod: normalizeSignupMethod(values.signupMethod ?? undefined),
  };
}

export function readMarketingAttributionFromSearchParams(
  searchParams: URLSearchParams
): MarketingAttribution {
  return readMarketingAttributionFromValues({
    source: searchParams.get("db_source"),
    landingPageH1Variant: searchParams.get("db_landing_page_h1_variant"),
    landingPageH1Copy: searchParams.get("db_landing_page_h1_copy"),
    signupMethod: searchParams.get("signup_method"),
  });
}

export function readMarketingAttributionFromStorage(): MarketingAttribution {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.sessionStorage.getItem(MARKETING_ATTRIBUTION_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as MarketingAttribution;

    return {
      source: parsed.source,
      landingPageH1Variant: parsed.landingPageH1Variant,
      landingPageH1Copy: parsed.landingPageH1Copy,
      signupMethod: normalizeSignupMethod(parsed.signupMethod),
      signupCompletedTracked: parsed.signupCompletedTracked === true,
    };
  } catch {
    return {};
  }
}

export function persistMarketingAttribution(
  updates: MarketingAttribution
): MarketingAttribution {
  if (typeof window === "undefined") {
    return updates;
  }

  const nextValue = {
    ...readMarketingAttributionFromStorage(),
    ...updates,
  };

  window.sessionStorage.setItem(
    MARKETING_ATTRIBUTION_STORAGE_KEY,
    JSON.stringify(nextValue)
  );

  return nextValue;
}

export function normalizeSignupMethod(
  value?: string
): MarketingAttribution["signupMethod"] {
  if (value === "email" || value === "google" || value === "github") {
    return value;
  }

  return undefined;
}

const planSelectionMetadataByPlanId = {
  basic: { billingPeriod: "monthly", selectedProduct: "basic" },
  basic_yearly: { billingPeriod: "yearly", selectedProduct: "basic" },
  pro: { billingPeriod: "monthly", selectedProduct: "pro" },
  pro_yearly: { billingPeriod: "yearly", selectedProduct: "pro" },
} as const;

export function getPlanSelectionMetadata(planId: string): {
  billingPeriod: "monthly" | "yearly";
  selectedProduct: "basic" | "pro" | "other";
} {
  const selection =
    planSelectionMetadataByPlanId[
      planId as keyof typeof planSelectionMetadataByPlanId
    ];

  if (selection) {
    return selection;
  }

  return { billingPeriod: "monthly", selectedProduct: "other" };
}
