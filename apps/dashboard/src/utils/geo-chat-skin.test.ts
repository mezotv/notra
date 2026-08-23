import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { geoChatSkin } from "@/utils/geo-chat-skin";

describe("geoChatSkin", () => {
  test("maps Claude engines to the Claude skin", () => {
    assert.equal(geoChatSkin("anthropic-direct-grounded"), "claude");
  });

  test("maps Gemini engines to the Gemini skin", () => {
    assert.equal(geoChatSkin("gemini-flash"), "gemini");
  });

  test("maps Perplexity engines to the Perplexity skin", () => {
    assert.equal(geoChatSkin("perplexity-sonar"), "perplexity");
    assert.equal(geoChatSkin("sonar-pro"), "perplexity");
  });

  test("falls back to ChatGPT for other engines", () => {
    assert.equal(geoChatSkin("openai-direct-grounded"), "chatgpt");
    assert.equal(geoChatSkin("grok-3"), "chatgpt");
  });
});
