import type { AILogTarget } from "@notra/ai/types/evlog-middleware";
import { buildEvlogMiddleware } from "@notra/ai/utils/evlog-middleware";
import { wrapLanguageModel } from "ai";

export type { AILogTarget } from "@notra/ai/types/evlog-middleware";

export function wrapModelWithObservability<T>(model: T, log?: AILogTarget): T {
  if (!log) {
    return model;
  }

  return wrapLanguageModel({
    model: model as never,
    middleware: buildEvlogMiddleware(log),
  }) as T;
}
