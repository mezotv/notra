import type { ContentType } from "@notra/ai/schemas/content";
import type { AgentDataPointSettings } from "@notra/ai/types/agents";
import type { BaseTonePromptInput } from "@notra/ai/types/prompts";
import type { GitHubSelectionFilters } from "@notra/ai/types/tools";
import type { PostSourceMetadata } from "@notra/db/schema";

export interface AgentContentTaskOptions {
  organizationId: string;
  collectionId: string;
  contentType: ContentType;
  contentLabel: string;
  brandAgentType: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch: string | null;
  }>;
  linearIntegrations?: Array<{ integrationId: string }>;
  promptInput: BaseTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: { since: string; until: string };
  autoPublish?: boolean;
  voiceId?: string;
}
