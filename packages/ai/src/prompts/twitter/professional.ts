import { buildTwitterPrompt } from "@notra/ai/prompts/twitter/shared";

export function getProfessionalTwitterPrompt(): string {
  return buildTwitterPrompt({
    toneContext: `
    Professional tone: clear, sharp, credible, outcome-oriented.
    Sound experienced, never corporate or inflated.
    Emphasize practical impact and decision quality.
    `,
    example: `
    Developer experience compounds.

    Cached auth failures now tell you what broke before they turn into a debugging session.
    `,
    badExample: `
    Excited to announce our latest release! We shipped some amazing features. Stay tuned!
    `,
    badExampleWhy: [
      "Vague and generic",
      "No specific value",
      "Sounds like marketing",
    ],
    thinkingInstructions:
      "Think through which updates demonstrate the most practical value, how to distill them for a Twitter audience, and what framing makes the insight feel credible in 280 characters. Do not expose internal reasoning.",
  });
}
