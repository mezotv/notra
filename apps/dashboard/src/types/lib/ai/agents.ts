import type { ChangelogOutput } from "@/schemas/ai/agents";
import type { ToneProfile } from "@/schemas/brand";
import type { ChangelogTonePromptInput } from "./prompts";

export interface ChangelogAgentResult {
  output: ChangelogOutput;
}

export interface ChangelogAgentOptions {
  organizationId: string;
  repositories: Array<{
    owner: string;
    repo: string;
    defaultBranch?: string | null;
  }>;
  tone?: ToneProfile;
  promptInput: ChangelogTonePromptInput;
}

export interface ChatAgentContext {
  organizationId: string;
  currentMarkdown: string;
  selectedText?: string;
  onMarkdownUpdate: (markdown: string) => void;
  brandContext?: string;
}
