import type {
  ChatModel,
  ContextItem,
  TextSelection,
} from "@notra/ai/types/chat";
import type { GitHubRepository } from "@/types/integrations";

export type ChatModelProvider = "anthropic" | "openai" | "auto";

export interface ChatModelOption {
  id: ChatModel;
  label: string;
  description: string;
  pricing: string;
  provider: ChatModelProvider;
  beta?: boolean;
}

export interface ChatInputProps {
  onSend?: (value: string) => void;
  isLoading?: boolean;
  statusText?: string;
  completionMessage?: string | null;
  selection?: TextSelection | null;
  onClearSelection?: () => void;
  organizationSlug?: string;
  organizationId?: string;
  context?: ContextItem[];
  onAddContext?: (item: ContextItem) => void;
  onRemoveContext?: (item: ContextItem) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string | null;
  onClearError?: () => void;
}

export type EnabledRepo = GitHubRepository & { integrationId: string };
