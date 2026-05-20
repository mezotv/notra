import type { AILogTarget } from "@notra/ai/observability";
import type { ToneProfile } from "@notra/ai/schemas/brand";
import type { PostSourceMetadata } from "@notra/db/schema";
import type { LanguageModelUsage } from "ai";
import type { PostSummary } from "./posts";
import type {
  BlogPostTonePromptInput,
  ChangelogTonePromptInput,
  LinkedInTonePromptInput,
  TwitterTonePromptInput,
} from "./prompts";
import type { TccMetadata } from "./tcc";
import type {
  CommitWindow,
  GitHubSelectionFilters,
  GitHubToolRepositoryContext,
  LinearToolContext,
} from "./tools";

export type ResolveIntegrationContext = (
  integrationId: string,
  options?: { organizationId?: string }
) => Promise<GitHubToolRepositoryContext>;

export type ResolveLinearIntegrationContext = (
  integrationId: string,
  options?: { organizationId?: string }
) => Promise<LinearToolContext>;

export type { AILogTarget } from "@notra/ai/observability";

export interface AgentDataPointSettings {
  includePullRequests?: boolean;
  includeCommits?: boolean;
  includeReleases?: boolean;
  includeLinearData?: boolean;
}

export interface AgentTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  raw?: LanguageModelUsage;
}

export interface ChangelogAgentResult {
  postId: string;
  title: string;
  posts: PostSummary[];
  usage?: AgentTokenUsage;
}

export interface LinearIntegrationRef {
  integrationId: string;
  teamName?: string;
}

export interface ChangelogAgentOptions {
  organizationId: string;
  voiceId?: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch?: string | null;
  }>;
  linearIntegrations?: LinearIntegrationRef[];
  tone?: ToneProfile;
  promptInput: ChangelogTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
  autoPublish?: boolean;
  resolveContext: ResolveIntegrationContext;
  resolveLinearContext?: ResolveLinearIntegrationContext;
  log?: AILogTarget;
  telemetryMetadata?: TccMetadata;
}

export interface LinkedInAgentResult {
  postId: string;
  title: string;
  posts: PostSummary[];
  usage?: AgentTokenUsage;
}

export interface LinkedInAgentOptions {
  organizationId: string;
  voiceId?: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch?: string | null;
  }>;
  linearIntegrations?: LinearIntegrationRef[];
  tone?: ToneProfile;
  promptInput: LinkedInTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
  autoPublish?: boolean;
  resolveContext: ResolveIntegrationContext;
  resolveLinearContext?: ResolveLinearIntegrationContext;
  log?: AILogTarget;
  telemetryMetadata?: TccMetadata;
}

export interface TwitterAgentResult {
  postId: string;
  title: string;
  posts: PostSummary[];
  usage?: AgentTokenUsage;
}

export interface TwitterAgentOptions {
  organizationId: string;
  voiceId?: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch?: string | null;
  }>;
  linearIntegrations?: LinearIntegrationRef[];
  tone?: ToneProfile;
  promptInput: TwitterTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
  autoPublish?: boolean;
  resolveContext: ResolveIntegrationContext;
  resolveLinearContext?: ResolveLinearIntegrationContext;
  log?: AILogTarget;
  telemetryMetadata?: TccMetadata;
}

export interface BlogPostAgentResult {
  postId: string;
  title: string;
  posts: PostSummary[];
  usage?: AgentTokenUsage;
}

export interface BlogPostAgentOptions {
  organizationId: string;
  voiceId?: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch?: string | null;
  }>;
  linearIntegrations?: LinearIntegrationRef[];
  tone?: ToneProfile;
  promptInput: BlogPostTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
  autoPublish?: boolean;
  resolveContext: ResolveIntegrationContext;
  resolveLinearContext?: ResolveLinearIntegrationContext;
  log?: AILogTarget;
  telemetryMetadata?: TccMetadata;
}

export interface ChatAgentContext {
  organizationId: string;
  currentMarkdown: string;
  selectedText?: string;
  onMarkdownUpdate: (markdown: string) => void;
  brandContext?: string;
  log?: AILogTarget;
  telemetryMetadata?: TccMetadata;
}
