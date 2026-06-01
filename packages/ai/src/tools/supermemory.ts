import { supermemoryTools } from "@supermemory/tools/ai-sdk";
import type { Tool } from "ai";
import type { ToolSet } from "../types/orchestration";

const MEMORY_DESCRIPTION =
  "**Memory**: Search, save, inspect, add, list, delete, and forget organization memory using Supermemory";

export function hasSupermemoryToolsConfigured(): boolean {
  return Boolean(process.env.SUPERMEMORY_API_KEY?.trim());
}

export function createSupermemoryToolSet(organizationId: string): ToolSet {
  const apiKey = process.env.SUPERMEMORY_API_KEY?.trim();
  if (!apiKey) {
    return { tools: {}, descriptions: [] };
  }

  return {
    tools: supermemoryTools(apiKey, {
      containerTags: [organizationId],
    }) as Record<string, Tool>,
    descriptions: [MEMORY_DESCRIPTION],
  };
}
