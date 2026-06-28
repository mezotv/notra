import type { PermissionTone } from "@notra/ui/components/ui/permission-selector";
import type { OAuthClientBrandId } from "@/constants/oauth-clients";

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

export interface OAuthScopeLevel {
  value: string;
  label: string;
  tone: PermissionTone;
  scopes: string[];
}

export interface OAuthScopeGroup {
  id: string;
  label: string;
  description: string;
  scopes: string[];
  levels: OAuthScopeLevel[];
}

export interface OAuthScopeSelectorProps {
  groups: OAuthScopeGroup[];
  defaultGrant: string;
}

export interface OAuthClientIdentity {
  client_id?: string;
  client_name?: string;
  client_uri?: string;
}

export interface OAuthBrandIconProps {
  className?: string;
}

export interface OAuthClientLogoProps {
  brandId: OAuthClientBrandId | null;
  name: string;
  className?: string;
}
