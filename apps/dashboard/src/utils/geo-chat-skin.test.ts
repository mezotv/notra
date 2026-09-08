import { describe, expect, test } from "bun:test";

import { geoChatSkin } from "./geo-chat-skin";

describe("geoChatSkin", () => {
  test("maps OpenCode engines onto the OpenCode mock instead of ChatGPT", () => {
    expect(geoChatSkin("opencode/gpt-5.6-sol-medium")).toBe("opencode");
    expect(geoChatSkin("opencode")).toBe("opencode");
  });

  test("keeps the existing engine skins", () => {
    expect(geoChatSkin("anthropic/claude-sonnet-5")).toBe("claude");
    expect(geoChatSkin("google/gemini-3-flash")).toBe("gemini");
    expect(geoChatSkin("perplexity/sonar")).toBe("perplexity");
    expect(geoChatSkin("openai/gpt-5.4")).toBe("chatgpt");
  });
});
