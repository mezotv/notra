import { describe, expect, test } from "bun:test";

import type { AgentReadinessIssue } from "@notra/db/types/agent-readiness";

import { GEO_AGENT_READINESS_NAV_LINK } from "@/constants/geo";

import {
  buildAgentReadinessAllFixesPrompt,
  canReuseAgentReadinessScan,
  groupAgentReadinessIssues,
} from "./agent-readiness";
import { resolveNavItems } from "./nav";

const NOW = new Date("2026-08-28T12:00:00.000Z").getTime();

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

describe("canReuseAgentReadinessScan", () => {
  test("reuses only a fresh scan for the current target", () => {
    const fresh = {
      createdAt: new Date(NOW - 60_000),
      targetUrl: "https://example.com",
    };

    expect(canReuseAgentReadinessScan(fresh, fresh.targetUrl, NOW)).toBe(true);
    expect(
      canReuseAgentReadinessScan(fresh, "https://new.example.com", NOW)
    ).toBe(false);
    expect(
      canReuseAgentReadinessScan(
        { ...fresh, createdAt: new Date("2026-08-28T11:00:00.000Z") },
        fresh.targetUrl,
        NOW
      )
    ).toBe(false);
  });
});

describe("agent readiness navigation", () => {
  test("hides the navigation item when the feature flag is off", () => {
    expect(
      resolveNavItems([GEO_AGENT_READINESS_NAV_LINK], {
        agentReadiness: false,
        analytics: true,
        iris: true,
      })
    ).toEqual([]);
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
