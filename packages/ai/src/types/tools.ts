import type { MCPClient } from "@ai-sdk/mcp";
import type {
  AgentDataPointSettings,
  ResolveLinearIntegrationContext,
} from "@notra/ai/types/agents";
import type { Tool } from "ai";

export interface CommitWindow {
  since: string;
  until: string;
}

export interface EditMarkdownContext {
  currentMarkdown: string;
  onUpdate: (markdown: string) => void;
}

export interface GitHubToolRepositoryContext {
  integrationId: string;
  organizationId: string;
  owner: string;
  repo: string;
  defaultBranch: string | null;
  token: string | undefined;
}

export interface GitHubToolsAccessConfig {
  organizationId?: string;
  allowedIntegrationIds?: string[];
  allowedPullRequestNumbersByIntegrationId?: Record<string, number[]>;
  allowedReleaseTagsByIntegrationId?: Record<string, string[]>;
  allowedReleaseTagsGlobal?: string[];
  allowedCommitShas?: string[];
  enforcedCommitWindow?: CommitWindow;
}

export interface GitHubSelectionFilters {
  allowedPullRequestNumbersByIntegrationId?: Record<string, number[]>;
  allowedReleaseTagsByIntegrationId?: Record<string, string[]>;
  allowedReleaseTagsGlobal?: string[];
  allowedCommitShas?: string[];
}

export interface LinearToolContext {
  integrationId: string;
  organizationId: string;
  accessToken: string;
  linearTeamId?: string | null;
}

export interface LinearToolsAccessConfig {
  organizationId?: string;
  allowedIntegrationIds?: string[];
}

export interface ErrorWithStatus {
  status?: number;
  message?: string;
  response?: {
    headers?: Record<string, string | number | undefined>;
    data?: unknown;
  };
}

export interface SkillMetadata {
  name: string;
  version?: string;
  description?: string;
  "allowed-tools"?: string[];
  folder: string;
  filename: string;
}

export interface Skill extends SkillMetadata {
  content: string;
}

export interface ToolDescription {
  intro: string;
  toolName: string;
  whenToUse?: string;
  whenNotToUse?: string;
  usageNotes?: string;
}

export type CachedWrapper = <TTool extends object>(
  tool: TTool,
  options?: {
    ttl?: number;
    keyGenerator?: (params: unknown, context?: unknown) => string;
    shouldCache?: (params: unknown, result: unknown) => boolean;
    debug?: boolean;
  }
) => TTool;

export interface BuildLinearDataToolsOptions {
  organizationId: string;
  allowedIntegrationIds: string[];
  dataPointSettings?: AgentDataPointSettings;
  resolveContext?: ResolveLinearIntegrationContext;
}

export interface McpRuntimeToolSet {
  tools: Record<string, Tool>;
  descriptions: string[];
  cleanup: () => Promise<void>;
}

export type McpRuntimeTool = Awaited<ReturnType<MCPClient["tools"]>>[string];
