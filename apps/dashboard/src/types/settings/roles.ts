import type { OrganizationScope, ScopeGroup } from "@notra/db/types/roles";

export interface OrganizationRoleSummary {
  id: string;
  name: string;
  description: string | null;
  scopes: OrganizationScope[];
  isSystem: boolean;
  memberCount: number;
  createdAt: string;
}

export interface RoleScopeSummary {
  visible: string[];
  remaining: number;
}

export interface RoleScopePickerProps {
  groups: ScopeGroup[];
  value: OrganizationScope[];
  onValueChange: (scopes: OrganizationScope[]) => void;
  disabled?: boolean;
}

export interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  scopeGroups: ScopeGroup[];
  role: OrganizationRoleSummary | null;
}

export interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  role: OrganizationRoleSummary | null;
}

export interface RoleListProps {
  roles: OrganizationRoleSummary[];
  scopeLabels: Record<string, string>;
  canManage: boolean;
  isLoading: boolean;
  onEdit: (role: OrganizationRoleSummary) => void;
  onDelete: (role: OrganizationRoleSummary) => void;
}

export interface RoleRowProps {
  role: OrganizationRoleSummary;
  scopeLabels: Record<string, string>;
  canManage: boolean;
  onEdit: (role: OrganizationRoleSummary) => void;
  onDelete: (role: OrganizationRoleSummary) => void;
}
