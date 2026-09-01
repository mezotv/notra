import type {
  ANALYTICS_AUTH_METHODS,
  BILLING_INTERVALS,
  CALLBACK_DESTINATIONS,
  ONBOARDING_STEPS,
  PAYWALL_KINDS,
  PLAN_SURFACES,
  SUGGESTION_OUTCOMES,
} from "@/constants/analytics-events";
import type { BillingPlan } from "@/types/billing/plan";

export type PaywallKind = (typeof PAYWALL_KINDS)[keyof typeof PAYWALL_KINDS];

export type PlanSurface = (typeof PLAN_SURFACES)[keyof typeof PLAN_SURFACES];

export type BillingInterval =
  (typeof BILLING_INTERVALS)[keyof typeof BILLING_INTERVALS];

export type OnboardingStep =
  (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

export type CallbackDestination =
  (typeof CALLBACK_DESTINATIONS)[keyof typeof CALLBACK_DESTINATIONS];

export type AnalyticsAuthMethod =
  (typeof ANALYTICS_AUTH_METHODS)[keyof typeof ANALYTICS_AUTH_METHODS];

export type SuggestionOutcome =
  (typeof SUGGESTION_OUTCOMES)[keyof typeof SUGGESTION_OUTCOMES];

export interface OnboardingStepViewTrackerProps {
  step: OnboardingStep;
  isResuming?: boolean;
  inOnboardingFlow?: boolean;
}

export interface LoginErrorTrackerProps {
  errorCode: string;
}

export interface PaywallShownTrackerProps {
  kind: PaywallKind;
  route?: string | null;
}

export interface PlanSelectedInput {
  plans: readonly BillingPlan[] | undefined;
  planId: string;
  isYearly: boolean;
  includeZdr: boolean;
  surface: PlanSurface;
}
