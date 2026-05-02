import { buildChangelogPrompt } from "@notra/ai/prompts/changelog/shared";

export function getFormalChangelogPrompt(): string {
  return buildChangelogPrompt({
    taskContext:
      "You are a senior technical writer preparing official release documentation for technical and enterprise audiences.",
    toneContext: `
    Formal tone: precise, composed, authoritative. Emphasize compatibility, risk, and migration implications where relevant.
    `,
    exampleHighlights: `
    ### Cache component support with actionable error guidance
    Runtime guardrails now catch unsupported auth calls in cached contexts and provide clear migration guidance with the correct usage pattern.

    ### Email link verification for signup flows
    Signup verification now supports secure email-link completion flows with explicit status handling for expiration and mismatch cases.

    ### Async initial state support for modern React apps
    Initial auth state can resolve asynchronously at hook usage points, reducing root layout complexity and keeping top-level rendering predictable.

    ### Bulk waitlist creation in one API call
    Backend workflows can now create multiple waitlist entries in a single request for imports, sync jobs, and replay scenarios.

    ### Cross-browser polished scrollbar styling
    Scrollbar behavior and visual treatment are now consistent across major browsers with slimmer rails and theme-aware states.
    `,
  });
}
