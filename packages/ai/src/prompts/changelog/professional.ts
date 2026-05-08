import { buildChangelogPrompt } from "@notra/ai/prompts/changelog/shared";

export function getProfessionalChangelogPrompt(): string {
  return buildChangelogPrompt({
    taskContext:
      "You are a technical product manager writing release updates for developers and technical stakeholders.",
    toneContext: `
    Professional tone: clear, precise, outcome-oriented. Emphasize practical impact and implementation detail without inflation.
    `,
    exampleHighlights: `
    ### Cache component support with actionable error guidance
    Auth calls that fail inside cached contexts now return a specific cause and the correct usage pattern, cutting time-to-resolution for a common class of integration bug.

    ### Email link verification for signup flows
    Signup completes through a secure email link with explicit handling for expired and mismatched tokens, removing a category of stuck-onboarding tickets.

    ### Async initial state support for modern React apps
    Initial auth state can resolve asynchronously at the hook, which lets root layouts stay simple and avoids a class of hydration regressions.

    ### Bulk waitlist creation in one API call
    A single endpoint accepts multiple waitlist entries, replacing per-row loops in import and sync jobs.

    ### Cross-browser polished scrollbar styling
    Scrollbars render consistently across browsers, with slimmer rails and theme-aware hover and active states.
    `,
  });
}
