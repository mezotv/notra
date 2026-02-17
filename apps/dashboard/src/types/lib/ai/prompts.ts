export interface ChangelogTonePromptInput {
  sourceTargets: string;
  todayUtc: string;
  lookbackLabel: string;
  lookbackStartIso: string;
  lookbackEndIso: string;
  companyName?: string;
  companyDescription?: string;
  audience?: string;
  customInstructions?: string | null;
}

export interface TextSelection {
  text: string;
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
}

export interface ContentEditorChatPromptParams {
  selection?: TextSelection;
  repoContext?: Array<{
    integrationId: string;
  }>;
  toolDescriptions?: string[];
  hasGitHubEnabled?: boolean;
}

export interface GithubWebhookMemoryPromptParams {
  eventType: "release" | "push" | "star";
  repository: string;
  action: string;
  data: Record<string, unknown>;
}
