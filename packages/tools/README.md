# @notra/tools

Shared eve tool implementations and primitives for Notra agents.

Eve derives a tool's public name from its file path, so each agent and subagent
keeps a small adapter file under its own `tools/` directory that re-exports a
definition from this package:

```ts
export { default } from "@notra/tools/onboarding/save-memory";
```

Layout:

- `src/onboarding/` — root tools of the onboarding agent (brand profile, references, memories, suggestions)
- `src/researcher/` — research subagent tools (context.dev scraping, GitHub, X)
- `src/skill-editor/` — skill CRUD tools
- `src/disabled.ts` — `createDisabledTool()` for switching off eve built-ins (the adapter file's name selects the built-in)
- `src/schemas/`, `src/types/`, `src/constants/`, `src/utils/` — the shared building blocks the tools are made of

Tenancy: every organization-scoped tool resolves its organization from
`ctx.session.auth` attributes (stamped by the agent's channel), never from model
input.
