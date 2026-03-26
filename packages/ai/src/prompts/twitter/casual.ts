import { buildTwitterPrompt } from "@notra/ai/prompts/twitter/shared";

export function getCasualTwitterPrompt(): string {
  return buildTwitterPrompt({
    toneContext: `
    Casual tone: friendly, simple, grounded, builder-first.
    Keep it human, never sloppy or gimmicky.
    `,
    example: `
    You know that bug where an auth error tells you nothing?

    Fixed that.

    Cached auth calls now point to the exact problem instead of making you guess.
    `,
    badExample: `
    Thrilled to announce our Q3 product update! Our team has been heads-down executing on our roadmap.
    `,
    badExampleWhy: [
      "Corporate language",
      "No personality",
      "Sounds like a press release",
    ],
    thinkingInstructions:
      "Think through what moment or story makes this update relatable, how to share it authentically in as few words as possible, and what would make someone hit retweet. Do not expose internal reasoning.",
  });
}
