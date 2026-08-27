import { describe, expect, test } from "bun:test";

import {
  buildBrandTerms,
  promptMentionsBrand,
  stripBrandTerms,
} from "./suggestion-keywords";

describe("promptMentionsBrand", () => {
  test("matches the full brand phrase, not a generic word inside it", () => {
    const terms = buildBrandTerms({
      companyName: "Email SDK",
      aliases: ["emailsdk"],
    });

    expect(promptMentionsBrand("What is Email SDK?", terms)).toBe(true);
    expect(promptMentionsBrand("Best email-sdk for Node", terms)).toBe(true);
    expect(
      promptMentionsBrand("What are the best tools for sending email?", terms)
    ).toBe(false);
  });
});

describe("stripBrandTerms", () => {
  test("strips hyphenated and spaced brand forms the same way", () => {
    expect(
      stripBrandTerms("Email-SDK is a toolkit for sending mail", ["email sdk"])
    ).toBe("is a toolkit for sending mail");
    expect(
      stripBrandTerms("Email SDK is a toolkit for sending mail", ["email-sdk"])
    ).toBe("is a toolkit for sending mail");
  });
});
