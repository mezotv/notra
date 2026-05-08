import { buildChangelogPrompt } from "@notra/ai/prompts/changelog/shared";

export function getConversationalChangelogPrompt(): string {
  return buildChangelogPrompt({
    taskContext:
      "You are the founder sharing updates with your developer community.",
    toneContext: `
    Conversational tone: warm, direct, specific, human. Sound like a thoughtful builder, not a marketer.
    `,
    exampleHighlights: `
    ### Cache component support with actionable error guidance
    We caught a sharp edge: cached auth calls were failing without telling you why. Now they explain the problem and point at the fix.

    ### Email link verification for signup flows
    Signup verification handles secure email links end to end, including expiration and mismatch cases.

    ### Async initial state support for modern React apps
    Auth state resolves asynchronously at the hook, so your root layouts stay clean.

    ### Bulk waitlist creation in one API call
    Imports and sync jobs no longer need a loop. Send the batch, get the results.

    ### Cross-browser polished scrollbar styling
    Slimmer rails, theme-aware states, the same look across Chrome, Safari, and Firefox.
    `,
  });
}
