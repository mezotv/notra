export interface StartOnboardingAgentSessionInput {
  organizationId: string;
  domain: string;
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
  skipped?: "already-started" | "no-company-domain" | "website-unreachable";
}

export interface OnboardingSlackInviteInput {
  email: string;
  organizationSlug: string;
}

export interface OnboardingSlackInviteResult {
  invited: boolean;
  channelId?: string;
}
