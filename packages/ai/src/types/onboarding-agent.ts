export interface OnboardingAgentWorkflowPayload {
  organizationId: string;
  domain: string;
  email?: string;
  organizationSlug?: string;
  reservedAt: string;
}
