export interface EditMarkdownContext {
  currentMarkdown: string;
  onUpdate: (markdown: string) => void;
}

export interface GitHubToolsAccessConfig {
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
