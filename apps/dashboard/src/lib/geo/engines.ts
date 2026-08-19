import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createPerplexity } from "@ai-sdk/perplexity";
import { gateway } from "@notra/ai/gateway";
import { type LanguageModel, type ToolSet, tool } from "ai";
import { z } from "zod";
import {
  GEO_ANTHROPIC_API_KEY_ENV,
  GEO_GROUNDED_ENGINES,
  GEO_GROUNDED_MAX_SEARCHES,
  GEO_OPENAI_API_KEY_ENV,
  GEO_PERPLEXITY_API_KEY_ENV,
} from "@/constants/geo";
import type { GeoGroundedEngine } from "@/types/geo";

const googleSearchTool = tool({
  type: "provider",
  id: "google.google_search",
  args: {},
  inputSchema: z.object({}),
});

const requireApiKey = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

export interface GeoGroundedInvocation {
  model: LanguageModel;
  tools: ToolSet;
}

export function buildGroundedInvocation(
  engine: GeoGroundedEngine
): GeoGroundedInvocation {
  switch (engine.provider) {
    case "gateway-openai":
      return {
        model: gateway(engine.model),
        tools: { web_search: openai.tools.webSearch({}) },
      };
    case "gateway-anthropic":
      return {
        model: gateway(engine.model),
        tools: {
          web_search: anthropic.tools.webSearch_20250305({
            maxUses: GEO_GROUNDED_MAX_SEARCHES,
          }),
        },
      };
    case "gateway-google":
      return {
        model: gateway(engine.model),
        tools: { google_search: googleSearchTool },
      };
    case "direct-openai": {
      const provider = createOpenAI({
        apiKey: requireApiKey(GEO_OPENAI_API_KEY_ENV),
      });
      return {
        model: provider.responses(engine.model),
        tools: { web_search: provider.tools.webSearch({}) },
      };
    }
    case "direct-anthropic": {
      const provider = createAnthropic({
        apiKey: requireApiKey(GEO_ANTHROPIC_API_KEY_ENV),
      });
      return {
        model: provider(engine.model),
        tools: {
          web_search: provider.tools.webSearch_20250305({
            maxUses: GEO_GROUNDED_MAX_SEARCHES,
          }),
        },
      };
    }
    default: {
      const provider = createPerplexity({
        apiKey: requireApiKey(GEO_PERPLEXITY_API_KEY_ENV),
      });
      return { model: provider(engine.model), tools: {} };
    }
  }
}

const SUPERSEDED_BY_DIRECT: Partial<
  Record<GeoGroundedEngine["provider"], GeoGroundedEngine["provider"]>
> = {
  "direct-openai": "gateway-openai",
  "direct-anthropic": "gateway-anthropic",
};

export function resolveGroundedEngines(): GeoGroundedEngine[] {
  const available = GEO_GROUNDED_ENGINES.filter((engine) =>
    engine.isAvailable()
  );

  const superseded = new Set<GeoGroundedEngine["provider"]>();
  for (const engine of available) {
    const replaced = SUPERSEDED_BY_DIRECT[engine.provider];
    if (replaced) {
      superseded.add(replaced);
    }
  }

  return available.filter((engine) => !superseded.has(engine.provider));
}
