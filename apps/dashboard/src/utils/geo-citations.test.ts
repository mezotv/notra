import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  citationProviderTooltip,
  formatCitationProvider,
} from "@/utils/geo-citations";

describe("formatCitationProvider", () => {
  test("prefers a non-empty agent", () => {
    assert.equal(
      formatCitationProvider("GPTBot", "openai", "crawler"),
      "GPTBot"
    );
  });

  test("falls back to the friendly source label for referrals", () => {
    assert.equal(
      formatCitationProvider("", "chatgpt", "ai_referral"),
      "ChatGPT"
    );
  });
});

describe("citationProviderTooltip", () => {
  test("uses the friendly referral title without repeating a case-only key", () => {
    assert.deepEqual(
      citationProviderTooltip({
        agent: "",
        source: "chatgpt",
        visitorType: "ai_referral",
        category: "assistant-referral",
        confidence: "reported",
      }),
      {
        title: "ChatGPT",
        raw: null,
        purpose: "Referral",
        confidence: "Reported",
      }
    );
  });

  test("keeps a raw key that differs from the title", () => {
    assert.deepEqual(
      citationProviderTooltip({
        agent: "",
        source: "you",
        visitorType: "ai_referral",
        category: "assistant-referral",
        confidence: "reported",
      }),
      {
        title: "You.com",
        raw: "you",
        purpose: "Referral",
        confidence: "Reported",
      }
    );
  });

  test("omits the raw line when it matches the title", () => {
    assert.deepEqual(
      citationProviderTooltip({
        agent: "GPTBot",
        source: "GPTBot",
        visitorType: "crawler",
        category: "training-crawler",
        confidence: "verified",
      }),
      {
        title: "GPTBot",
        raw: null,
        purpose: "Model training",
        confidence: "Verified",
      }
    );
  });
});
