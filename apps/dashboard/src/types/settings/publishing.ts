export interface ApprovalWorkflowAccessGroupRef {
  id: string;
  name: string;
}

export interface ApprovalWorkflowStepSummary {
  id: string;
  stepOrder: number;
  name: string | null;
  requiredApprovals: number;
  reviewerAccessGroup: ApprovalWorkflowAccessGroupRef;
}

export interface ApprovalWorkflowSummary {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  appliesToAccessGroup: ApprovalWorkflowAccessGroupRef | null;
  steps: ApprovalWorkflowStepSummary[];
  createdAt: string;
}

export interface WorkflowStepDraft {
  key: string;
  reviewerAccessGroupId: string;
  requiredApprovals: number;
  name: string;
}

export interface WorkflowStepsBuilderProps {
  steps: WorkflowStepDraft[];
  accessGroups: ApprovalWorkflowAccessGroupRef[];
  disabled?: boolean;
  onStepsChange: (steps: WorkflowStepDraft[]) => void;
}

export interface WorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  accessGroups: ApprovalWorkflowAccessGroupRef[];
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
