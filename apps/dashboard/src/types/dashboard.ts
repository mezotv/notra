export interface OrgSelectOption {
  id: string;
  name: string;
  logo?: string | null;
}

export interface OrganizationOptionsListProps {
  organizations: OrgSelectOption[];
  selectedOrganizationId?: string | null;
  onSelect: (organizationId: string) => void;
  disabled?: boolean;
}

export interface ContentPublishingMetricsData {
  drafts: number;
  published: number;
  graph: {
    activity: Array<{
      date: string;
      count: number;
      level: number;
      drafts: number;
      published: number;
    }>;
  };
}
