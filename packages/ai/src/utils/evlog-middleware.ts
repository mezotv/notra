import type {
  LanguageModelV4StreamPart,
  LanguageModelV4Usage,
} from "@ai-sdk/provider";
import type {
  AILogTarget,
  AiAccumulatorState,
  AiEventData,
  AiStepUsage,
  AiUsageAccumulator,
} from "@notra/ai/types/evlog-middleware";
import type { LanguageModelMiddleware } from "ai";

function createAccumulatorState(): AiAccumulatorState {
  return {
    calls: 0,
    steps: 0,
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      reasoningTokens: 0,
    },
    models: [],
    lastProvider: undefined,
    allToolCalls: [],
    stepsUsage: [],
    lastFinishReason: undefined,
    lastMsToFirstChunk: undefined,
    lastMsToFinish: undefined,
    lastError: undefined,
    lastResponseId: undefined,
  };
}

function addUsage(acc: AiUsageAccumulator, usage: LanguageModelV4Usage) {
  acc.inputTokens += usage.inputTokens.total ?? 0;
  acc.outputTokens += usage.outputTokens.total ?? 0;
  acc.cacheReadTokens += usage.inputTokens.cacheRead ?? 0;
  acc.cacheWriteTokens += usage.inputTokens.cacheWrite ?? 0;
  acc.reasoningTokens += usage.outputTokens.reasoning ?? 0;
}

function resolveProviderAndModel(provider: string, modelId: string) {
  if (provider !== "gateway" || !modelId.includes("/")) {
    return { provider, model: modelId };
  }
  const slashIndex = modelId.indexOf("/");
  return {
    provider: modelId.slice(0, slashIndex),
    model: modelId.slice(slashIndex + 1),
  };
}

function flushState(log: AILogTarget, state: AiAccumulatorState) {
  const uniqueModels = [...new Set(state.models)];
  const lastModel = state.models.at(-1);
  const data: AiEventData = {
    calls: state.calls,
    inputTokens: state.usage.inputTokens,
    outputTokens: state.usage.outputTokens,
    totalTokens: state.usage.inputTokens + state.usage.outputTokens,
  };
  if (lastModel) {
    data.model = lastModel;
  }
  if (state.lastProvider) {
    data.provider = state.lastProvider;
  }
  if (uniqueModels.length > 1) {
    data.models = uniqueModels;
  }
  if (state.usage.cacheReadTokens > 0) {
    data.cacheReadTokens = state.usage.cacheReadTokens;
  }
  if (state.usage.cacheWriteTokens > 0) {
    data.cacheWriteTokens = state.usage.cacheWriteTokens;
  }
  if (state.usage.reasoningTokens > 0) {
    data.reasoningTokens = state.usage.reasoningTokens;
  }
  if (state.lastFinishReason) {
    data.finishReason = state.lastFinishReason;
  }
  if (state.allToolCalls.length > 0) {
    data.toolCalls = [...state.allToolCalls];
  }
  if (state.lastResponseId) {
    data.responseId = state.lastResponseId;
  }
  if (state.steps > 1) {
    data.steps = state.steps;
    data.stepsUsage = [...state.stepsUsage];
  }
  if (state.lastMsToFirstChunk !== undefined) {
    data.msToFirstChunk = state.lastMsToFirstChunk;
  }
  if (state.lastMsToFinish !== undefined) {
    data.msToFinish = state.lastMsToFinish;
    if (state.usage.outputTokens > 0 && state.lastMsToFinish > 0) {
      data.tokensPerSecond = Math.round(
        (state.usage.outputTokens / state.lastMsToFinish) * 1000
      );
    }
  }
  if (state.lastError) {
    data.error = state.lastError;
  }
  log.set({ ai: data });
}

function recordModel(
  state: AiAccumulatorState,
  provider: string,
  modelId: string,
  responseModelId?: string
) {
  const resolved = resolveProviderAndModel(
    provider,
    responseModelId ?? modelId
  );
  state.models.push(resolved.model);
  state.lastProvider = resolved.provider;
}

function recordError(
  log: AILogTarget,
  state: AiAccumulatorState,
  model: { provider: string; modelId: string },
  error: unknown
) {
  state.calls++;
  state.steps++;
  recordModel(state, model.provider, model.modelId);
  state.lastFinishReason = "error";
  state.lastError = error instanceof Error ? error.message : String(error);
  const resolved = resolveProviderAndModel(model.provider, model.modelId);
  state.stepsUsage.push({
    model: resolved.model,
    inputTokens: 0,
    outputTokens: 0,
  });
  flushState(log, state);
}

export function buildEvlogMiddleware(
  log: AILogTarget
): LanguageModelMiddleware {
  const state = createAccumulatorState();

  return {
    specificationVersion: "v4",
    wrapGenerate: async ({ doGenerate, model }) => {
      try {
        const result = await doGenerate();
        state.calls++;
        state.steps++;
        addUsage(state.usage, result.usage);
        recordModel(
          state,
          model.provider,
          model.modelId,
          result.response?.modelId
        );
        state.lastFinishReason = result.finishReason.unified;
        if (result.response?.id) {
          state.lastResponseId = result.response.id;
        }
        const stepToolCalls: string[] = [];
        for (const item of result.content) {
          if (item.type === "tool-call") {
            state.allToolCalls.push(item.toolName);
            stepToolCalls.push(item.toolName);
          }
        }
        const resolvedModel = resolveProviderAndModel(
          model.provider,
          result.response?.modelId ?? model.modelId
        );
        const stepUsage: AiStepUsage = {
          model: resolvedModel.model,
          inputTokens: result.usage.inputTokens.total ?? 0,
          outputTokens: result.usage.outputTokens.total ?? 0,
        };
        if (stepToolCalls.length > 0) {
          stepUsage.toolCalls = stepToolCalls;
        }
        state.stepsUsage.push(stepUsage);
        flushState(log, state);
        return result;
      } catch (error) {
        recordError(log, state, model, error);
        throw error;
      }
    },
    wrapStream: async ({ doStream, model }) => {
      const streamStart = Date.now();
      let firstChunkTime: number | undefined;
      let streamUsage: AiUsageAccumulator | undefined;
      let streamFinishReason: string | undefined;
      let streamModelId: string | undefined;
      let streamResponseId: string | undefined;
      const streamToolCalls: string[] = [];
      let streamError: string | undefined;

      let doStreamResult: Awaited<ReturnType<typeof doStream>>;
      try {
        doStreamResult = await doStream();
      } catch (error) {
        recordError(log, state, model, error);
        throw error;
      }

      const { stream, ...rest } = doStreamResult;
      const transformStream = new TransformStream<
        LanguageModelV4StreamPart,
        LanguageModelV4StreamPart
      >({
        transform(chunk, controller) {
          if (!firstChunkTime && chunk.type === "text-delta") {
            firstChunkTime = Date.now();
          }
          if (chunk.type === "tool-input-start") {
            streamToolCalls.push(chunk.toolName);
          }
          if (chunk.type === "finish") {
            streamUsage = {
              inputTokens: chunk.usage.inputTokens.total ?? 0,
              outputTokens: chunk.usage.outputTokens.total ?? 0,
              cacheReadTokens: chunk.usage.inputTokens.cacheRead ?? 0,
              cacheWriteTokens: chunk.usage.inputTokens.cacheWrite ?? 0,
              reasoningTokens: chunk.usage.outputTokens.reasoning ?? 0,
            };
            streamFinishReason = chunk.finishReason.unified;
          }
          if (chunk.type === "response-metadata") {
            if (chunk.modelId) {
              streamModelId = chunk.modelId;
            }
            if (chunk.id) {
              streamResponseId = chunk.id;
            }
          }
          if (chunk.type === "error") {
            streamError =
              chunk.error instanceof Error
                ? chunk.error.message
                : String(chunk.error);
          }
          controller.enqueue(chunk);
        },
        flush() {
          state.calls++;
          state.steps++;
          if (streamUsage) {
            state.usage.inputTokens += streamUsage.inputTokens;
            state.usage.outputTokens += streamUsage.outputTokens;
            state.usage.cacheReadTokens += streamUsage.cacheReadTokens;
            state.usage.cacheWriteTokens += streamUsage.cacheWriteTokens;
            state.usage.reasoningTokens += streamUsage.reasoningTokens;
          }
          recordModel(state, model.provider, model.modelId, streamModelId);
          state.lastFinishReason = streamFinishReason;
          state.allToolCalls.push(...streamToolCalls);
          if (streamResponseId) {
            state.lastResponseId = streamResponseId;
          }
          if (firstChunkTime) {
            state.lastMsToFirstChunk = firstChunkTime - streamStart;
          }
          state.lastMsToFinish = Date.now() - streamStart;
          if (streamError) {
            state.lastError = streamError;
          }
          const resolvedModel = resolveProviderAndModel(
            model.provider,
            streamModelId ?? model.modelId
          );
          const stepUsage: AiStepUsage = {
            model: resolvedModel.model,
            inputTokens: streamUsage?.inputTokens ?? 0,
            outputTokens: streamUsage?.outputTokens ?? 0,
          };
          if (streamToolCalls.length > 0) {
            stepUsage.toolCalls = [...streamToolCalls];
          }
          state.stepsUsage.push(stepUsage);
          flushState(log, state);
        },
      });

      return {
        stream: stream.pipeThrough(transformStream),
        ...rest,
      };
    },
  };
}
