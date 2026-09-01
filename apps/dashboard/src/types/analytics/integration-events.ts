import type {
  ANALYTICS_VIEW_STATES,
  BRAND_REFERENCE_SOURCES,
  INTEGRATION_AUTH_KINDS,
  INTEGRATION_PROVIDERS,
  MCP_CONNECTION_TEST_OUTCOMES,
  SLACK_CHANNEL_KINDS,
} from "@/constants/integration-analytics";

export type IntegrationProvider =
  (typeof INTEGRATION_PROVIDERS)[keyof typeof INTEGRATION_PROVIDERS];

export type IntegrationAuthKind =
  (typeof INTEGRATION_AUTH_KINDS)[keyof typeof INTEGRATION_AUTH_KINDS];

export type SlackChannelKind =
  (typeof SLACK_CHANNEL_KINDS)[keyof typeof SLACK_CHANNEL_KINDS];

export type AnalyticsViewState =
  (typeof ANALYTICS_VIEW_STATES)[keyof typeof ANALYTICS_VIEW_STATES];

export type McpConnectionTestOutcome =
  (typeof MCP_CONNECTION_TEST_OUTCOMES)[keyof typeof MCP_CONNECTION_TEST_OUTCOMES];

export type BrandReferenceSource =
  (typeof BRAND_REFERENCE_SOURCES)[keyof typeof BRAND_REFERENCE_SOURCES];

export interface TrackIntegrationConnectedInput {
  headers: Headers;
  userId?: string | null;
  organizationId?: string | null;
  provider: IntegrationProvider;
  authKind: IntegrationAuthKind;
}

export interface TrackIntegrationConnectFailedInput extends TrackIntegrationConnectedInput {
  errorCode: string;
}
