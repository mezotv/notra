export type IntegrationConnectResolution =
  | { kind: "not-found" }
  | { kind: "redirect"; path: string };

export type OrganizationIntegrationConnectResolution =
  | { kind: "redirect"; path: string }
  | { kind: "render"; connectSlug: string };

export interface OrganizationIntegrationConnectParams {
  organizationSlug: string;
  integrationSlugParam: string;
}
