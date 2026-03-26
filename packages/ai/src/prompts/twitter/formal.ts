import { buildTwitterPrompt } from "@notra/ai/prompts/twitter/shared";

export function getFormalTwitterPrompt(): string {
  return buildTwitterPrompt({
    toneContext: `
    Formal tone: precise, composed, authoritative, concise.
    Sound executive, but still readable and human.
    Prioritize clarity, consequences, and decisions.
    `,
    example: `
    Reliability improves when failure states are explicit.

    Cached authentication errors now surface the exact cause and the next corrective step.
    `,
    badExample: `
    Super excited about what we shipped! The team crushed it. Check it out!
    `,
    badExampleWhy: [
      "Informal filler",
      "No substantive information",
      "Does not reflect composed leadership communication",
    ],
    thinkingInstructions:
      "Consider which updates carry the most strategic significance, how to frame them concisely for a Twitter audience, and what implication is worth emphasizing inside the character limit. Do not expose internal reasoning.",
  });
}
