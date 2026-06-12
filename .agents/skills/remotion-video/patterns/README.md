# Story Patterns

Five narrative templates that map a PR type to a scene sequence. The skill detects the PR type in Phase 3.1 and loads the matching pattern file.

## Detection Signals

| Signal | Pattern |
|---|---|
| Public API / types / exports change (e.g. new hook, new prop, new function) | `api-library-feature` |
| UI component files (`*.tsx` under `components/` or `ui/`), Storybook stories, CSS changes | `ui-feature` |
| Perf keywords in title (ms, throughput, speedup, faster, x%); benchmark files | `performance-win` |
| "fix" in title, `bug` label, links to bug issues | `bug-fix` |
| None of the above | `generic-fallback` |

## Pattern Shape

Each pattern file documents:

- **When to use** — the PR types this fits
- **Scene sequence** — ordered list of Scene types with rough timing (for 30s default)
- **Code handling** — whether to synthesize, use diff, or skip code
- **Hook pattern bias** — which hook patterns (from `hooks/hook-patterns.md`) tend to work best

## Overrides

The user can override pattern detection in Phase 3.1. The detected pattern is a default, not a commitment.
