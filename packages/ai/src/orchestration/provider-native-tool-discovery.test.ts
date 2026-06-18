import { describe, expect, test } from "bun:test";
import type { Tool } from "ai";
import { tool } from "ai";
import { z } from "zod";
import {
  createProviderNativeToolRuntime,
  getProviderNativeToolDiscoverySupport,
  mergeProviderOptions,
} from "./provider-native-tool-discovery";

type ToolWithProviderOptions = Tool & {
  providerOptions?: {
    openai?: {
      deferLoading?: boolean;
      namespace?: { name: string; description: string };
    };
    anthropic?: {
      deferLoading?: boolean;
    };
  };
};

const testTools = {
  listAvailableSkills: createTestTool("List available skills"),
  getSkillByName: createTestTool("Get a skill by name"),
  getAvailableIntegrations: createTestTool("List connected integrations"),
  createBlogPost: createTestTool("Create a blog post draft"),
  getPullRequests: createTestTool("Get GitHub pull requests"),
};

describe("provider-native tool discovery", () => {
  test("uses OpenAI tool_search with deferred namespaced Notra tools", () => {
    const runtime = createProviderNativeToolRuntime({
      modelId: "openai/gpt-5.4-mini",
      tools: testTools,
      defaultActiveToolNames: [
        "listAvailableSkills",
        "getSkillByName",
        "getAvailableIntegrations",
      ],
    });

    expect(runtime?.provider).toBe("openai");
    expect(Boolean(runtime?.tools.toolSearch)).toBe(true);
    expect(runtime?.tools.searchNotraTools).toBe(undefined);
    expect(runtime?.tools.activateNotraTools).toBe(undefined);

    const deferredTool = runtime?.tools
      .createBlogPost as ToolWithProviderOptions;
    expect(deferredTool.providerOptions?.openai?.deferLoading).toBe(true);
    expect(deferredTool.providerOptions?.openai?.namespace?.name).toBe(
      "notra_content"
    );

    const defaultTool = runtime?.tools
      .listAvailableSkills as ToolWithProviderOptions;
    expect(defaultTool.providerOptions?.openai?.deferLoading).toBe(undefined);
    expect(defaultTool.providerOptions?.openai?.namespace?.name).toBe(
      "notra_skills"
    );
  });

  test("uses Anthropic tool search with deferred Notra tools", () => {
    const runtime = createProviderNativeToolRuntime({
      modelId: "anthropic/claude-sonnet-4.6",
      tools: testTools,
      defaultActiveToolNames: ["listAvailableSkills"],
    });

    expect(runtime?.provider).toBe("anthropic");
    expect(Boolean(runtime?.tools.toolSearch)).toBe(true);
    expect(runtime?.tools.searchNotraTools).toBe(undefined);

    const deferredTool = runtime?.tools
      .getPullRequests as ToolWithProviderOptions;
    expect(deferredTool.providerOptions?.anthropic?.deferLoading).toBe(true);

    const defaultTool = runtime?.tools
      .listAvailableSkills as ToolWithProviderOptions;
    expect(defaultTool.providerOptions?.anthropic?.deferLoading).toBe(
      undefined
    );
  });

  test("excludes unsupported providers from native discovery", () => {
    expect(
      createProviderNativeToolRuntime({
        modelId: "openai/gpt-oss-120b",
        tools: testTools,
        defaultActiveToolNames: ["listAvailableSkills"],
      })
    ).toBe(null);
    expect(getProviderNativeToolDiscoverySupport("moonshot/kimi-k2")).toBe(
      null
    );
  });

  test("keeps compatibility checks provider-specific", () => {
    expect(
      getProviderNativeToolDiscoverySupport("openai/gpt-5.4-nano")
        ?.supportsToolSearch
    ).toBe(true);
    expect(
      getProviderNativeToolDiscoverySupport("vercel/anthropic/claude-opus-4.8")
        ?.supportsToolSearch
    ).toBe(true);
    expect(
      getProviderNativeToolDiscoverySupport("anthropic/claude-haiku-4.0")
        ?.supportsToolSearch
    ).toBe(false);
  });

  test("merges provider options without dropping gateway options", () => {
    const merged = mergeProviderOptions(
      {
        anthropic: { thinking: { type: "enabled", budgetTokens: 1024 } },
        gateway: { caching: "auto", models: ["anthropic/claude-haiku-4.5"] },
      },
      {
        anthropic: {
          mcpServers: [
            {
              type: "url",
              name: "docs",
              url: "https://example.com/mcp",
              toolConfiguration: { enabled: true },
            },
          ],
        },
      }
    );

    expect(JSON.stringify(merged?.anthropic?.thinking)).toBe(
      JSON.stringify({
        type: "enabled",
        budgetTokens: 1024,
      })
    );
    expect(
      Array.isArray(merged?.anthropic?.mcpServers)
        ? merged.anthropic.mcpServers.length
        : 0
    ).toBe(1);
    expect(JSON.stringify(merged?.gateway?.models)).toBe(
      JSON.stringify(["anthropic/claude-haiku-4.5"])
    );
  });
});

function createTestTool(description: string): Tool {
  return tool({
    description,
    inputSchema: z.object({ value: z.string().optional() }),
    execute: async () => ({ ok: true }),
  });
}
