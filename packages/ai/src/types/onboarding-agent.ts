export interface OnboardingAgentWorkflowPayload {
  organizationId: string;
  domain: string;
  email?: string;
  organizationSlug?: string;
  /** ISO timestamp token from the reservation, used to safely release it. */
  reservedAt: string;
}
