export function geoDashboardPath(
  organizationSlug: string,
  projectId?: string
): string {
  const base = `/${organizationSlug}/geo`;
  return projectId ? `${base}?project=${encodeURIComponent(projectId)}` : base;
}

export function geoOnboardingPath(projectId?: string): string {
  const base = "/onboarding/visibility";
  return projectId ? `${base}?project=${encodeURIComponent(projectId)}` : base;
}

export function geoOnboardingCompetitorsPath(projectId?: string): string {
  const base = "/onboarding/competitors";
  return projectId ? `${base}?project=${encodeURIComponent(projectId)}` : base;
}
