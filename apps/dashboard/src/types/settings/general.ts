export interface GeneralSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export interface OrganizationDetails {
  id: string;
  logo?: string | null;
  name: string;
  slug: string;
}

export interface OrganizationDetailsCardProps {
  organization: OrganizationDetails;
  slug: string;
}
