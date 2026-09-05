export function resolveOrganizationId(
  organizationSlug: string,
  activeOrganization: { id: string; slug: string } | null | undefined,
  orgFromList: { id: string } | undefined
): string {
  if (activeOrganization?.slug === organizationSlug) {
    return activeOrganization.id;
  }

  return orgFromList?.id ?? "";
}
