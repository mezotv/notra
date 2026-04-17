import type { AILogTarget } from "@notra/ai/observability";
import type { StandaloneChatContextItem } from "@notra/ai/schemas/standalone-chat";
import type { LanguageModelUsage, UIMessage } from "ai";
import type {
  ResolveIntegrationContext,
  ResolveLinearIntegrationContext,
} from "./agents";
import type { IntegrationFetchers, OrchestrateResult } from "./orchestration";

export interface StandaloneChatInput {
  organizationId: string;
  messages: UIMessage[];
  context?: StandaloneChatContextItem[];
  maxSteps?: number;
  log?: AILogTarget;
  requestedModel?: string;
  enableThinking?: boolean;
  thinkingLevel?: "off" | "low" | "medium" | "high";
  abortSignal?: AbortSignal;
}

export interface StandaloneChatDeps {
  integrationFetchers?: IntegrationFetchers;
  resolveContext?: ResolveIntegrationContext;
  resolveLinearContext?: ResolveLinearIntegrationContext;
  onUsage?: (
    usage: LanguageModelUsage,
    modelId: string
  ) => void | Promise<void>;
  onFirstChunk?: () => void;
  log?: AILogTarget;
}

export type { StandaloneChatContextItem } from "@notra/ai/schemas/standalone-chat";
export type { OrchestrateResult } from "./orchestration";
