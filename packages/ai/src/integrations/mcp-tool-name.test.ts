import { describe, expect, test } from "bun:test";
import { createMcpRuntimeToolName } from "./mcp-tool-name";

const HASHED_RUNTIME_TOOL_NAME_REGEX = /^mcp_[a-z0-9_-]+_[a-f0-9]{8}$/;
const COLLISION_RUNTIME_TOOL_NAME_REGEX =
  /^mcp_my_server_abc1234567_search_docs_[a-f0-9]{8}$/;

describe("createMcpRuntimeToolName", () => {
  test("sanitizes server and tool names into a stable MCP runtime name", () => {
    expect(
      createMcpRuntimeToolName({
        integrationId: "mcp_abc1234567890",
        serverName: "My Server",
        serverToolName: "Search Docs!",
      })
    ).toBe("mcp_my_server_abc1234567_search_docs");
  });

  test("keeps generated names within the AI SDK tool name limit", () => {
    const name = createMcpRuntimeToolName({
      integrationId: "mcp_abcdef0123456789",
      serverName: "Very Long Server Name With Spaces",
      serverToolName: "tool ".repeat(30),
    });

    expect(name.length).toBeLessThanOrEqual(64);
    expect(name).toMatch(HASHED_RUNTIME_TOOL_NAME_REGEX);
  });

  test("adds a deterministic hash suffix for collision resolution", () => {
    const params = {
      integrationId: "mcp_abc1234567890",
      serverName: "My Server",
      serverToolName: "Search Docs",
    };
    const baseName = createMcpRuntimeToolName(params);
    const collisionName = createMcpRuntimeToolName({
      ...params,
      withHash: true,
    });

    expect(collisionName).not.toBe(baseName);
    expect(collisionName).toMatch(COLLISION_RUNTIME_TOOL_NAME_REGEX);
    expect(collisionName.length).toBeLessThanOrEqual(64);
  });
});
