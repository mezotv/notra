import type { PostSourceMetadata } from "@notra/db/schema";
import type { ToneProfile } from "@/schemas/brand";
import type { PostSummary } from "@/types/posts";
import type {
  BlogPostTonePromptInput,
  ChangelogTonePromptInput,
  LinkedInTonePromptInput,
  TwitterTonePromptInput,
} from "./prompts";
import type { CommitWindow, GitHubSelectionFilters } from "./tools";

export interface AgentDataPointSettings {
  includePullRequests?: boolean;
  includeCommits?: boolean;
  includeReleases?: boolean;
  includeLinearIssues?: boolean;
}

export interface ChangelogAgentResult {
  postId: string;
  title: string;
  posts: PostSummary[];
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
  tone?: ToneProfile;
  promptInput: ChangelogTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
  autoPublish?: boolean;
}

export interface LinkedInAgentResult {
  postId: string;
  title: string;
  posts: PostSummary[];
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
  tone?: ToneProfile;
  promptInput: LinkedInTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
  autoPublish?: boolean;
}

export interface TwitterAgentResult {
  postId: string;
  title: string;
  posts: PostSummary[];
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
  tone?: ToneProfile;
  promptInput: TwitterTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
  autoPublish?: boolean;
}

export interface BlogPostAgentResult {
  postId: string;
  title: string;
  posts: PostSummary[];
}

export interface BlogPostAgentOptions {
  organizationId: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch?: string | null;
  }>;
  tone?: ToneProfile;
  promptInput: BlogPostTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: CommitWindow;
  autoPublish?: boolean;
}

export interface ChatAgentContext {
  organizationId: string;
  currentMarkdown: string;
  selectedText?: string;
  onMarkdownUpdate: (markdown: string) => void;
  brandContext?: string;
}
