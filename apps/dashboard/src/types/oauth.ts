export interface OAuthOrganizationOption {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface OAuthConsentOrganizations {
  organizations: OAuthOrganizationOption[];
  activeOrganizationId: string | null;
}

export interface OAuthOrgSelectorProps {
  organizations: OAuthOrganizationOption[];
  initialOrganizationId: string | null;
}
