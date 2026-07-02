import type { createAILogger } from "evlog/ai";

export type AILogTarget = Parameters<typeof createAILogger>[0];

export interface AiUsageAccumulator {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
}

export interface AiStepUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls?: string[];
}

export interface AiEventData {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model?: string;
  models?: string[];
  provider?: string;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  reasoningTokens?: number;
  finishReason?: string;
  toolCalls?: string[];
  responseId?: string;
  steps?: number;
  stepsUsage?: AiStepUsage[];
  msToFirstChunk?: number;
  msToFinish?: number;
  tokensPerSecond?: number;
  error?: string;
}

export interface AiAccumulatorState {
  calls: number;
  steps: number;
  usage: AiUsageAccumulator;
  models: string[];
  lastProvider: string | undefined;
  allToolCalls: string[];
  stepsUsage: AiStepUsage[];
  lastFinishReason: string | undefined;
  lastMsToFirstChunk: number | undefined;
  lastMsToFinish: number | undefined;
  lastError: string | undefined;
  lastResponseId: string | undefined;
}
