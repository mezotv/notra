import { buildChangelogPrompt } from "@notra/ai/prompts/changelog/shared";

export function getCasualChangelogPrompt(): string {
  return buildChangelogPrompt({
    taskContext: "You are a developer writing release updates for teammates.",
    toneContext: `
    Casual tone: direct, useful, human. Plain language, practical takeaways, no ceremony.
    `,
    exampleHighlights: `
    ### Cache component support with actionable error guidance
    Unsupported auth calls in cached contexts now surface clear migration guidance.

    ### Email link verification for signup flows
    Signup verification supports secure email-link flows with expiration and mismatch handling.

    ### Async initial state support for modern React apps
    Auth state resolves asynchronously at hook level, simplifying root layouts.

    ### Bulk waitlist creation in one API call
    Multiple waitlist entries can be created in a single request for imports and sync jobs.

    ### Cross-browser polished scrollbar styling
    Scrollbar visuals are now consistent across browsers with slimmer rails and theme-aware states.
    `,
  });
}
