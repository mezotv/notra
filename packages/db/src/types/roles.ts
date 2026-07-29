import type { ORGANIZATION_SCOPES } from "../constants/permissions";

export type OrganizationScope = (typeof ORGANIZATION_SCOPES)[number];

export interface ScopeDefinition {
  scope: OrganizationScope;
  label: string;
  description: string;
}

export interface ScopeGroup {
  resource: string;
  label: string;
  scopes: ScopeDefinition[];
}

export interface SystemRoleDefinition {
  key: string;
  name: string;
  description: string;
  scopes: OrganizationScope[];
}

export interface ApprovalWorkflowStepSnapshot {
  stepOrder: number;
  reviewerRoleId: string;
  reviewerRoleName: string;
  requiredApprovals: number;
  name: string | null;
}
