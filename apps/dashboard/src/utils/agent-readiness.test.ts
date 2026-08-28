import { describe, expect, test } from "bun:test";

import type { AgentReadinessIssue } from "@notra/db/types/agent-readiness";

import {
  buildAgentReadinessAllFixesPrompt,
  groupAgentReadinessIssues,
} from "./agent-readiness";

function issue(
  overrides: Partial<AgentReadinessIssue> &
    Pick<AgentReadinessIssue, "id" | "name" | "tier" | "result">
): AgentReadinessIssue {
  return {
    details: null,
    recommendation: null,
    ...overrides,
  };
}

describe("groupAgentReadinessIssues", () => {
  test("groups by action priority and sorts failed first", () => {
    const grouped = groupAgentReadinessIssues([
      issue({
        id: "oauth",
        name: "OAuth 2.0 support",
        result: "partial",
        tier: "essential",
      }),
      issue({
        id: "404",
        name: "Agent-friendly 404s",
        result: "failed",
        tier: "essential",
      }),
      issue({
        id: "mcp",
        name: "MCP server / manifest",
        result: "partial",
        tier: "recommended",
      }),
    ]);

    expect(grouped.mustDo.map((item) => item.id)).toEqual(["404", "oauth"]);
    expect(grouped.shouldDo.map((item) => item.id)).toEqual(["mcp"]);
  });
});

describe("agent readiness prompts", () => {
  test("layers Notra instructions and keeps must-do above should-do", () => {
    const prompt = buildAgentReadinessAllFixesPrompt("https://example.com", [
      issue({
        id: "mcp",
        name: "MCP server / manifest",
        result: "partial",
        tier: "recommended",
      }),
      issue({
        id: "404",
        name: "Agent-friendly 404s",
        result: "failed",
        tier: "essential",
      }),
    ]);

    expect(prompt).toContain("You are a coding agent");
    expect(prompt).toContain("## Must do");
    expect(prompt).toContain("## Should do");
    expect(prompt.indexOf("Agent-friendly 404s")).toBeLessThan(
      prompt.indexOf("MCP server / manifest")
    );
  });
});
