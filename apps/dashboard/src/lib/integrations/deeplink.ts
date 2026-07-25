export function buildIntegrationConnectLoginUrl(
  integrationSlug: string
): string {
  const returnTo = `/integrations/${encodeURIComponent(integrationSlug)}`;
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function buildOrganizationIntegrationsPath(
  organizationSlug: string
): string {
  return `/${organizationSlug}/integrations`;
}

export function buildOrganizationIntegrationConnectPath(
  organizationSlug: string,
  integrationSlug: string
): string {
  return `${buildOrganizationIntegrationsPath(organizationSlug)}/${encodeURIComponent(integrationSlug)}`;
}

export function decodeIntegrationSlugParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
