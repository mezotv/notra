# Pattern: api-library-feature

## When to Use

- New public API, hook, or utility function
- New library integration or protocol support
- New type that changes how consumers write code

## Scene Sequence (30s target)

1. **HookTitle** (0-3s) — Result or Comparison pattern preferred
2. **ProblemSetup** (3-8s) — show the "before" world (what developers do today, usually painful)
3. **LibrarySwap** or **CodeSnippet** (8-22s) — core showcase of the new API in action
4. **CTAEndScreen** (22-30s) — "Try it / Install it / Read the docs" + URL

## Code Handling

**Synthesize realistic usage code.** The PR diff usually shows the implementation; the compelling story is how consumers *use* it. Example: a PR that adds "Standard Schema" support shouldn't show the schema definition — it should show a user swapping from zod to valibot with one line changed.

Verify synthesized code against the library's actual public API (docs/examples/source) before including it in the story.

## Hook Pattern Bias

Strong fit:
- Result (`"Validate any schema in one line"`)
- Comparison (`"Zod vs Valibot — same code"`)
- Curiosity-gap (`"One library, every validator — how?"`)

Weaker fit: Mistake, Pattern-interrupt (can work but harder to land in 7 words for API features).

## Example

PR: adds `@standard-schema/spec` support to a form library.

- HookTitle: `"Zod, Valibot, Arktype — same code"` (Comparison, 5 words)
- ProblemSetup: "Three libraries, three syntaxes, same task"
- LibrarySwap: shared Standard Schema validation code with import line cycling through `zod`, `valibot`, `arktype`
- CTAEndScreen: "Ship it" + `standardschema.dev`
