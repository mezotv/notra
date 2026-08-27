import { describe, expect, test } from "bun:test";

import {
  agentFeedbackClientInitial,
  normalizeAgentClient,
  resolveAgentFeedbackClientBrand,
} from "./agent-feedback-client";

describe("resolveAgentFeedbackClientBrand", () => {
  test("maps known coding agents by display name", () => {
    expect(resolveAgentFeedbackClientBrand("Claude Desktop")).toBe("claude");
    expect(resolveAgentFeedbackClientBrand("Claude Code")).toBe("claude");
    expect(resolveAgentFeedbackClientBrand("Cursor")).toBe("cursor");
    expect(resolveAgentFeedbackClientBrand("OpenAI Agents SDK")).toBe("openai");
    expect(resolveAgentFeedbackClientBrand("Vercel AI SDK")).toBe("vercel");
    expect(resolveAgentFeedbackClientBrand("Windsurf")).toBe("windsurf");
    expect(resolveAgentFeedbackClientBrand("Amp")).toBe("amp");
    expect(resolveAgentFeedbackClientBrand("Playwright QA Agent")).toBe(
      "playwright"
    );
    expect(resolveAgentFeedbackClientBrand("Notra Demo Agent")).toBe("notra");
  });

  test("does not treat generic words as Amp", () => {
    expect(resolveAgentFeedbackClientBrand("Custom QA Agent")).toBeNull();
    expect(
      resolveAgentFeedbackClientBrand("Internal Research Agent")
    ).toBeNull();
    expect(resolveAgentFeedbackClientBrand("example")).toBeNull();
  });

  test("returns null for empty clients", () => {
    expect(resolveAgentFeedbackClientBrand(null)).toBeNull();
    expect(resolveAgentFeedbackClientBrand("   ")).toBeNull();
  });
});

describe("normalizeAgentClient", () => {
  test("collapses punctuation into words", () => {
    expect(normalizeAgentClient("claude-desktop")).toBe("claude desktop");
  });
});

describe("agentFeedbackClientInitial", () => {
  test("uses the first normalized letter", () => {
    expect(agentFeedbackClientInitial("Custom QA Agent")).toBe("C");
  });
});
