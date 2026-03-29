import type { AILogTarget } from "@notra/ai/observability";
import type { streamText, UIMessage } from "ai";

export interface ValidatedGitHubIntegration {
  id: string;
  type: "github";
  enabled: boolean;
  displayName: string;
  organizationId: string;
  repositories: Array<{
    id: string;
    owner: string;
    repo: string;
    defaultBranch: string | null;
    enabled: boolean;
  }>;
}

export interface ValidatedLinearIntegration {
  id: string;
  type: "linear";
  enabled: boolean;
  displayName: string;
  organizationId: string;
  linearTeamId?: string | null;
  linearTeamName?: string | null;
}

export type ValidatedIntegration =
  | ValidatedGitHubIntegration
  | ValidatedLinearIntegration;

export interface EnabledCapabilities {
  github: boolean;
  linear: boolean;
  skills: boolean;
  markdown: boolean;
}

export interface TextSelection {
  text: string;
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
}

export interface GitHubContextItem {
  type: "github-repo";
  owner: string;
  repo: string;
  integrationId: string;
}

export interface LinearContextItem {
  type: "linear-team";
  integrationId: string;
  teamName?: string;
}

export type ContextItem = GitHubContextItem | LinearContextItem;

export interface RoutingDecision {
  complexity: "simple" | "complex";
  requiresTools: boolean;
  reasoning: string;
}

export interface RoutingResult {
  model: string;
  complexity: "simple" | "complex";
  requiresTools: boolean;
  reasoning: string;
}

export interface ToolSet {
  tools: Record<string, import("ai").Tool>;
  descriptions: string[];
}

export interface RepoContext {
  integrationId: string;
}

export interface LinearContext {
  integrationId: string;
}

export interface OrchestrateInput {
  organizationId: string;
  messages: UIMessage[];
  currentMarkdown: string;
  contentType?: string;
  selection?: TextSelection;
  context?: ContextItem[];
  maxSteps?: number;
  log?: AILogTarget;
}

export interface OrchestrateResult {
  stream: ReturnType<typeof streamText>;
  routingDecision: RoutingResult;
}

export interface BuildToolSetParams {
  organizationId: string;
  currentMarkdown: string;
  onMarkdownUpdate?: (markdown: string) => void;
  validatedIntegrations: ValidatedIntegration[];
}

export interface GitHubIntegrationData {
  id: string;
  organizationId: string;
  enabled: boolean;
  displayName: string;
  repositories: Array<{
    id: string;
    owner: string;
    repo: string;
    defaultBranch?: string | null;
    enabled: boolean;
  }>;
}

export interface LinearIntegrationData {
  id: string;
  organizationId: string;
  enabled: boolean;
  displayName: string;
  linearTeamId?: string | null;
  linearTeamName?: string | null;
}

export type GetGitHubIntegrationById = (
  integrationId: string
) => Promise<GitHubIntegrationData | null>;

export type GetLinearIntegrationById = (
  integrationId: string
) => Promise<LinearIntegrationData | null>;

export interface IntegrationFetchers {
  getGitHubIntegrationById?: GetGitHubIntegrationById;
  getLinearIntegrationById?: GetLinearIntegrationById;
}
