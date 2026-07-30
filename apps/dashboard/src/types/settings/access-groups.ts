import type {
  OrganizationScope,
  ScopeGroup,
} from "@notra/db/types/access-groups";

export interface AccessGroupSummary {
  id: string;
  name: string;
  description: string | null;
  scopes: OrganizationScope[];
  isSystem: boolean;
  memberCount: number;
  createdAt: string;
}

export interface AccessGroupScopeSummary {
  visible: string[];
  remaining: number;
}

export interface AccessGroupScopePickerProps {
  groups: ScopeGroup[];
  value: OrganizationScope[];
  onValueChange: (scopes: OrganizationScope[]) => void;
  disabled?: boolean;
}

export interface AccessGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  scopeGroups: ScopeGroup[];
  accessGroup: AccessGroupSummary | null;
}

export interface DeleteAccessGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  accessGroup: AccessGroupSummary | null;
}

export interface AccessGroupListProps {
  accessGroups: AccessGroupSummary[];
  scopeLabels: Record<string, string>;
  canManage: boolean;
  isLoading: boolean;
  onEdit: (accessGroup: AccessGroupSummary) => void;
  onDelete: (accessGroup: AccessGroupSummary) => void;
}

export interface AccessGroupRowProps {
  accessGroup: AccessGroupSummary;
  scopeLabels: Record<string, string>;
  canManage: boolean;
  onEdit: (accessGroup: AccessGroupSummary) => void;
  onDelete: (accessGroup: AccessGroupSummary) => void;
}
