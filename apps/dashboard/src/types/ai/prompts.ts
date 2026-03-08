export interface BaseTonePromptInput {
  sourceTargets: string;
  todayUtc: string;
  lookbackLabel: string;
  lookbackStartIso: string;
  lookbackEndIso: string;
  companyName?: string;
  companyDescription?: string;
  audience?: string;
  customInstructions?: string | null;
  language?: string;
}

export type ChangelogTonePromptInput = BaseTonePromptInput;
export type LinkedInTonePromptInput = BaseTonePromptInput;
export type TwitterTonePromptInput = BaseTonePromptInput;
export type BlogPostTonePromptInput = BaseTonePromptInput;

export interface TextSelection {
  text: string;
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
}

export interface ContentEditorChatPromptParams {
  selection?: TextSelection;
  contentType?: string;
  repoContext?: Array<{
    integrationId: string;
  }>;
  toolDescriptions?: string[];
  hasGitHubEnabled?: boolean;
}

export interface GithubWebhookMemoryPromptParams {
  eventType: "release" | "push";
  repository: string;
  action: string;
  data: Record<string, unknown>;
}
