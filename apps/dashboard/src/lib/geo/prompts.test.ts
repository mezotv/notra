import { describe, expect, test } from "bun:test";

import type { GeoSettings } from "../../types/geo";
import { buildGeoPrompts } from "./prompts";
import { promptMentionsBrand } from "./suggestion-keywords";

function settings(companyName: string, aliases: string[] = []): GeoSettings {
  return { companyName, aliases } as GeoSettings;
}

function texts(
  companyName: string,
  description: string | null,
  audience: string | null = null
) {
  return buildGeoPrompts(settings(companyName), {
    companyDescription: description,
    audience,
  }).map((prompt) => prompt.text);
}

describe("buildGeoPrompts", () => {
  test("does not paste an Email SDK-style description into the category", () => {
    const prompts = texts(
      "Email SDK",
      "Email SDK is a developer toolkit for sending transactional emails at scale."
    );

    expect(prompts.length).toBeGreaterThan(0);
    for (const prompt of prompts) {
      expect(promptMentionsBrand(prompt, ["email sdk"])).toBe(false);
      expect(prompt).not.toMatch(/developer toolkit/i);
      expect(prompt).toMatch(/sending transactional emails/i);
    }
  });

  test("never mentions the company name, even in alternatives or what-is", () => {
    const prompts = texts(
      "Notra",
      "Notra is an AI content-generation platform for marketing teams."
    );

    expect(prompts.length).toBeGreaterThan(0);
    for (const prompt of prompts) {
      expect(promptMentionsBrand(prompt, ["notra"])).toBe(false);
      expect(prompt).not.toMatch(/\bis an\b/i);
    }
    expect(prompts.some((prompt) => /content-generation/i.test(prompt))).toBe(
      true
    );
  });

  test("uses the product type when the for-clause is an audience", () => {
    const prompts = texts("Resend", "Resend is the email API for developers.");

    expect(prompts.some((prompt) => /email api/i.test(prompt))).toBe(true);
    for (const prompt of prompts) {
      expect(promptMentionsBrand(prompt, ["resend"])).toBe(false);
    }
  });

  test("extracts a verb phrase from help-style descriptions", () => {
    const prompts = texts(
      "Notra",
      "We help SaaS companies generate changelogs automatically."
    );

    expect(prompts.some((prompt) => /generate changelogs/i.test(prompt))).toBe(
      true
    );
  });

  test("strips the brand from a Linear-style product sentence", () => {
    const prompts = texts(
      "Linear",
      "Linear is the issue tracking tool built for high-performance teams."
    );

    expect(prompts.some((prompt) => /issue tracking/i.test(prompt))).toBe(true);
    for (const prompt of prompts) {
      expect(promptMentionsBrand(prompt, ["linear"])).toBe(false);
    }
  });

  test("reads like a typed ChatGPT prompt, not a headline", () => {
    const prompts = texts(
      "Email SDK",
      "Email SDK is a developer toolkit for sending transactional emails at scale."
    );

    expect(prompts.length).toBeGreaterThan(0);
    for (const prompt of prompts) {
      expect(prompt.charAt(0)).toBe(prompt.charAt(0).toLowerCase());
      expect(prompt.endsWith("?")).toBe(false);
    }
    expect(prompts[0]).toBe(
      "what tools should I use for sending transactional emails"
    );
  });

  test("falls back without dumping a leftover sentence", () => {
    const prompts = texts("Acme", "Acme!");

    expect(prompts.length).toBeGreaterThan(0);
    for (const prompt of prompts) {
      expect(promptMentionsBrand(prompt, ["acme"])).toBe(false);
      expect(prompt).toMatch(/this space/i);
    }
  });
});
