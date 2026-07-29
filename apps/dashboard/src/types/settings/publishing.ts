export interface ApprovalWorkflowRoleRef {
  id: string;
  name: string;
}

export interface ApprovalWorkflowStepSummary {
  id: string;
  stepOrder: number;
  name: string | null;
  requiredApprovals: number;
  reviewerRole: ApprovalWorkflowRoleRef;
}

export interface ApprovalWorkflowSummary {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  appliesToRole: ApprovalWorkflowRoleRef | null;
  steps: ApprovalWorkflowStepSummary[];
  createdAt: string;
}

export interface WorkflowStepDraft {
  key: string;
  reviewerRoleId: string;
  requiredApprovals: number;
  name: string;
}

export interface WorkflowStepsBuilderProps {
  steps: WorkflowStepDraft[];
  roles: ApprovalWorkflowRoleRef[];
  disabled?: boolean;
  onStepsChange: (steps: WorkflowStepDraft[]) => void;
}

export interface WorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  roles: ApprovalWorkflowRoleRef[];
  workflow: ApprovalWorkflowSummary | null;
}

export interface DeleteWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  workflow: ApprovalWorkflowSummary | null;
}

export interface WorkflowListProps {
  workflows: ApprovalWorkflowSummary[];
  canManage: boolean;
  isLoading: boolean;
  onEdit: (workflow: ApprovalWorkflowSummary) => void;
  onDelete: (workflow: ApprovalWorkflowSummary) => void;
}

export interface WorkflowCardProps {
  workflow: ApprovalWorkflowSummary;
  canManage: boolean;
  onEdit: (workflow: ApprovalWorkflowSummary) => void;
  onDelete: (workflow: ApprovalWorkflowSummary) => void;
}
