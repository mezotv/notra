export interface StartOnboardingAgentSessionInput {
  organizationId: string;
  domain: string;
  reservedAt: string;
}

export interface EnsureDefaultBrandIdentityInput {
  companyName: string;
  organizationId: string;
  websiteUrl: string;
}

export interface CompanyDomainResolution {
  domain: string;
  source: "website" | "email";
}

export interface TriggerOnboardingAgentSetupInput {
  organizationId: string;
  websiteUrl?: string;
}

export interface TriggerOnboardingAgentSetupResult {
  success: boolean;
  skipped?: "no-company-domain";
}

export interface OnboardingAgentSetupTaskInput {
  domain: string;
  email: string;
  organizationId: string;
}

export interface OnboardingSlackInviteInput {
  email: string;
  organizationName: string;
}

export interface OnboardingSlackInviteResult {
  invited: boolean;
  channelId?: string;
}

export interface LaunchReservedOnboardingAgentInput {
  payload: Omit<OnboardingAgentWorkflowPayload, "reservedAt">;
  reservedAt: Date;
}

import type { OnboardingAgentWorkflowPayload } from "@notra/ai/types/onboarding-agent";
