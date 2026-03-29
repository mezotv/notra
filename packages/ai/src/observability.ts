import { createAILogger } from "evlog/ai";

export type AILogTarget = Parameters<typeof createAILogger>[0];

export function wrapModelWithObservability<T>(model: T, log?: AILogTarget): T {
  if (!log) {
    return model;
  }

  return createAILogger(log).wrap(model as never) as T;
}
