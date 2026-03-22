import { buildTwitterPrompt } from "@notra/ai/prompts/twitter/shared";

export function getConversationalTwitterPrompt(): string {
  return buildTwitterPrompt({
    toneContext: `
    Conversational tone: warm, direct, specific, human.
    Sound like a thoughtful builder, not a marketer.
    Punchier and shorter than LinkedIn. Every word earns its place.
    `,
    example: `
    Shipping a fix is easy.

    Explaining the error is the hard part.

    Cached auth calls now tell you what broke and what to do next.
    `,
    badExample: `
    We shipped 15 PRs this week including cache support, email verification, async state, bulk waitlist, and scrollbar fixes. Check our changelog!
    `,
    badExampleWhy: [
      "Feature dump, not a tweet",
      "No hook or clear point of view",
      "Too many updates for one post",
    ],
    thinkingInstructions:
      "Think through which update is most compelling for a Twitter audience, how to distill it into the fewest possible words, and what hook will stop the scroll. Do not expose internal reasoning.",
  });
}
