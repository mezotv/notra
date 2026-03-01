import type { PostSourceMetadata } from "@notra/db/schema";
import type { ToneProfile } from "@/schemas/brand";
import type {
  ChangelogTonePromptInput,
  LinkedInTonePromptInput,
} from "./prompts";

export interface ChangelogAgentResult {
  postId: string;
  title: string;
}

export interface ChangelogAgentOptions {
  organizationId: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch?: string | null;
  }>;
  tone?: ToneProfile;
  promptInput: ChangelogTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
}

export interface LinkedInAgentResult {
  postId: string;
  title: string;
}

export interface LinkedInAgentOptions {
  organizationId: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch?: string | null;
  }>;
  tone?: ToneProfile;
  promptInput: LinkedInTonePromptInput;
  sourceMetadata?: PostSourceMetadata;
}

export interface ChatAgentContext {
  organizationId: string;
  currentMarkdown: string;
  selectedText?: string;
  onMarkdownUpdate: (markdown: string) => void;
  brandContext?: string;
}
