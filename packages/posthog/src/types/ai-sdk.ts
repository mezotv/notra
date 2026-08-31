export interface PostHogModelTracingOptions {
  distinctId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
  feature?: string | null;
  privacyMode?: boolean;
  properties?: Record<string, string | number | boolean | null | undefined>;
}
