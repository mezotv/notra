import { devToolsMiddleware } from "@ai-sdk/devtools";
import { gateway, type LanguageModel, wrapLanguageModel } from "ai";

export function createAgentModel(modelId: string): LanguageModel {
  const base = gateway(modelId);
  if (process.env.AI_SDK_DEVTOOLS !== "true") {
    return base;
  }

  return wrapLanguageModel({
    model: base,
    middleware: devToolsMiddleware(),
  });
}
