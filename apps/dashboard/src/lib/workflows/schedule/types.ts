import type { ToneProfile } from "@notra/ai/schemas/tone";
import type {
  AgentDataPointSettings,
  ResolveIntegrationContext,
} from "@notra/ai/types/agents";
import type { GitHubSelectionFilters } from "@notra/ai/types/tools";
import type { PostSourceMetadata } from "@notra/db/schema";
import type { PostSummary } from "@/types/posts";

export interface ContentGenerationContext {
  organizationId: string;
  repositories: Array<{
    integrationId: string;
    owner: string;
    repo: string;
    defaultBranch: string | null;
  }>;
  tone: ToneProfile;
  promptInput: {
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
  };
  sourceMetadata: PostSourceMetadata;
  dataPointSettings?: AgentDataPointSettings;
  selectionFilters?: GitHubSelectionFilters;
  commitWindow?: {
    since: string;
    until: string;
  };
  voiceId?: string;
  autoPublish?: boolean;
  resolveContext: ResolveIntegrationContext;
}

export type ContentGenerationResult =
  | {
      status: "ok";
      postId: string;
      title: string;
      posts: PostSummary[];
    }
  | { status: "rate_limited"; retryAfterSeconds?: number }
  | { status: "generation_failed"; reason: string }
  | { status: "unsupported_output_type"; outputType: string };

export type ContentHandler = (
  ctx: ContentGenerationContext
) => Promise<ContentGenerationResult>;
