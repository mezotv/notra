import type { agentFeedback } from "@notra/db/schema";
import type {
  AgentFeedbackKind,
  AgentFeedbackStatus,
} from "@notra/db/types/agent-feedback";
import type { AuthenticatedUser } from "@/types/auth/organization";

export type AgentFeedbackRow = typeof agentFeedback.$inferSelect;

export type AgentFeedbackItem = Omit<
  AgentFeedbackRow,
  "createdAt" | "updatedAt" | "resolvedAt"
> & {
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type AgentFeedbackStatusFilter = AgentFeedbackStatus | "all";

export interface AgentFeedbackListResponse {
  items: AgentFeedbackItem[];
  nextCursor: string | null;
  counts: Record<AgentFeedbackStatus, number>;
}

export type AgentFeedbackSnippetKey = "mcp" | "fetch" | "curl";

export type AgentFeedbackSetupSnippets = Record<
  AgentFeedbackSnippetKey,
  string
>;

export interface AgentFeedbackSetupResponse {
  apiUrl: string;
  token: string;
  prompt: string;
  snippets: AgentFeedbackSetupSnippets;
}

export interface AgentFeedbackSetupPanelProps {
  setup: AgentFeedbackSetupResponse | undefined;
  organizationId: string;
  className?: string;
}

export interface AgentFeedbackEmptyProps {
  organizationId: string;
}

export interface AgentFeedbackRotateButtonProps {
  organizationId: string;
  disabled?: boolean;
}

export interface AgentFeedbackTokenResult {
  token: string;
  organizationName: string;
}

export interface AgentFeedbackListInput {
  organizationId: string;
  status?: AgentFeedbackStatus;
  kind?: AgentFeedbackKind;
  cursor?: string;
  limit?: number;
}

export interface AgentFeedbackTableProps {
  items: AgentFeedbackItem[];
  isPending: boolean;
  selectedId: string | null;
  onSelect: (item: AgentFeedbackItem) => void;
}

export interface AgentFeedbackDetailDialogProps {
  item: AgentFeedbackItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: AgentFeedbackStatus) => void;
  isUpdating: boolean;
}

export interface AgentFeedbackSetupCardProps {
  organizationId: string;
}

export interface AgentFeedbackStatusBadgeProps {
  status: AgentFeedbackStatus;
}

export interface AgentFeedbackKindBadgeProps {
  kind: AgentFeedbackKind;
}

export interface AgentFeedbackPageClientProps {
  organizationSlug: string;
}

export interface AgentFeedbackHandlerOptions<TInput> {
  context: { headers: Headers; user?: AuthenticatedUser };
  input: TInput;
}

export interface AgentFeedbackOrganizationTokenState {
  generation: number;
  name: string;
}

export interface AgentFeedbackUpdateStatusInput {
  organizationId: string;
  feedbackId: string;
  status: AgentFeedbackStatus;
}

export interface AgentFeedbackCursor {
  createdAt: Date;
  id: string;
}

export interface AgentFeedbackDetailFieldProps {
  label: string;
  value: string | null;
  mono?: boolean;
}

export interface AgentFeedbackSetupDialogProps {
  organizationId: string;
}

export type AgentFeedbackGenerationCacheMode = "fill" | "overwrite";
