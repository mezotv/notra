import type { useLogger } from "@notra/ai/evlog";
import type { StandaloneChatContextItem } from "@notra/ai/schemas/standalone-chat";
import type { ExternalChannelId } from "@notra/ai/types/chat";
import type { ValidatedIntegration } from "@notra/ai/types/orchestration";
import type { TccMetadata } from "@notra/ai/types/tcc";
import type { UIMessage } from "ai";

type ChatLogger = ReturnType<typeof useLogger>;

type ChatThinkingLevel = "off" | "low" | "medium" | "high";

export interface DirectStandaloneChatArgs {
  organizationId: string;
  chatId: string;
  messages: UIMessage[];
  context: StandaloneChatContextItem[];
  validatedIntegrations: ValidatedIntegration[];
  useMarkup: boolean;
  requestId: string;
  log: ChatLogger;
  model?: string;
  enableThinking?: boolean;
  thinkingLevel?: ChatThinkingLevel;
  timezone?: string;
  abortSignal?: AbortSignal;
  externalChannelId?: ExternalChannelId;
  telemetryMetadata: TccMetadata;
}
