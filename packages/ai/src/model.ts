import { gateway } from "@notra/ai/gateway";
import {
  type AILogTarget,
  wrapModelWithObservability,
} from "@notra/ai/observability";
import type { GatewayArgs } from "@notra/ai/types/gateway";
import type { SupermemoryOptions } from "@notra/ai/types/model";
import { withSupermemory } from "@supermemory/tools/ai-sdk";
import {
  type LanguageModel,
  type LanguageModelMiddleware,
  wrapLanguageModel,
} from "ai";

export interface CreateModelOptions {
  supermemory?: Omit<SupermemoryOptions, "mode" | "addMemory">;
  disableMemory?: boolean;
}

type DevToolsMiddleware =
  typeof import("@ai-sdk/devtools")["devToolsMiddleware"];

type SupermemoryModel = Parameters<typeof withSupermemory>[0];

export function createModel(
  organizationId: string | undefined,
  modelId: GatewayArgs[0],
  options?: CreateModelOptions,
  log?: AILogTarget
): LanguageModel {
  const base = gateway(modelId);

  if (!organizationId || options?.disableMemory) {
    return wrapModelForDevTools(wrapModelWithObservability(base, log));
  }

  const supermemoryApiKey = process.env.SUPERMEMORY_API_KEY?.trim();
  if (!supermemoryApiKey) {
    return wrapModelForDevTools(wrapModelWithObservability(base, log));
  }

  const model = withSupermemory(asSupermemoryModel(base), organizationId, {
    apiKey: supermemoryApiKey,
    mode: "full",
    addMemory: "always",
    ...options?.supermemory,
  });

  return wrapModelForDevTools(wrapModelWithObservability(model, log));
}

function asSupermemoryModel(model: LanguageModel): SupermemoryModel {
  return model as unknown as SupermemoryModel;
}

function wrapModelForDevTools(
  model: Exclude<LanguageModel, string>
): LanguageModel {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.AI_SDK_DEVTOOLS !== "true"
  ) {
    return model;
  }

  return wrapLanguageModel({
    model,
    middleware: createLazyDevToolsMiddleware(),
  });
}

function createLazyDevToolsMiddleware(): LanguageModelMiddleware {
  let middlewarePromise: Promise<LanguageModelMiddleware> | undefined;

  const getMiddleware = async () => {
    middlewarePromise ??= import("@ai-sdk/devtools").then(
      ({ devToolsMiddleware }: { devToolsMiddleware: DevToolsMiddleware }) =>
        devToolsMiddleware()
    );
    return middlewarePromise;
  };

  return {
    specificationVersion: "v4",
    async transformParams(options) {
      const middleware = await getMiddleware();
      return middleware.transformParams
        ? middleware.transformParams(options)
        : options.params;
    },
    async wrapGenerate(options) {
      const middleware = await getMiddleware();
      return middleware.wrapGenerate
        ? middleware.wrapGenerate(options)
        : options.doGenerate();
    },
    async wrapStream(options) {
      const middleware = await getMiddleware();
      return middleware.wrapStream
        ? middleware.wrapStream(options)
        : options.doStream();
    },
  };
}
