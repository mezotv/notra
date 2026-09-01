# Detection

## Objective

Identify the active stack and integration surface using repository signals, then choose an approach that fits existing architecture.

## Suggested Scan Order

1. dependency manifests (`package.json`, `Gemfile`, `composer.json`, `pyproject.toml`, `requirements*.txt`, `go.mod`, `pom.xml`, `build.gradle*`)
2. framework/router entrypoints
3. auth and token utilities
4. styling and component patterns
5. package manager and lockfiles

## Common Stack Signals

### JavaScript/TypeScript

- Next.js: `next`
- TanStack Start: `@tanstack/react-start`
- TanStack Router: `@tanstack/react-router`
- React Router: `react-router` or `react-router-dom`
- Vite: `vite` or `vite.config.*`
- SvelteKit: `@sveltejs/kit` or `svelte.config.*`

### Other Stacks

- Ruby: `Gemfile` and WorkOS/AuthKit gems
- PHP: `composer.json` and WorkOS/AuthKit packages
- Python: `pyproject.toml` or `requirements*.txt` with WorkOS/AuthKit packages
- Go: `go.mod` with `github.com/workos/workos-go`
- Java: `pom.xml` or `build.gradle*` with WorkOS dependencies/imports

## AuthKit/WorkOS Presence Signals

Look for any existing AuthKit/WorkOS usage before implementing widgets.

- JavaScript/TypeScript: `@workos-inc/*`, `@workos/*`, or WorkOS/AuthKit imports in app/server code
- Ruby: WorkOS/AuthKit gems or initialization code
- PHP: WorkOS/AuthKit composer packages or bootstrap usage
- Python: WorkOS/AuthKit packages/imports and config usage
- Go: WorkOS Go module imports/config
- Java: WorkOS Java dependency/imports/config

If no AuthKit/WorkOS signal is found, see SKILL.md step 4.

## Detection Heuristics

- Prefer entrypoint ownership over dependency names alone.
- In mixed repositories, identify which app owns UI rendering and which service owns token generation.
- Use the strongest cluster of signals, then validate by checking real route/auth files.

## Data-Layer Signals

- React Query signal: `@tanstack/react-query`
- SWR signal: `swr`
- No query library signal: use the project's native async/data approach with direct fetch/http calls.

When React Query or SWR is already established, keep using it for caching/invalidation and wrap direct endpoint calls with it.

## Package Manager/Tool Detection

Use the project's existing package manager/tooling when installing missing dependencies.

- JavaScript/TypeScript:
  - `pnpm-lock.yaml` -> `pnpm`
  - `yarn.lock` -> `yarn`
  - `bun.lockb` or `bun.lock` -> `bun`
  - `package-lock.json` -> `npm`
  - if unclear, use existing install scripts or ask once
- Ruby: use `bundle`/Bundler with `Gemfile`
- PHP: use `composer` with `composer.json`
- Python: follow existing tooling (`poetry.lock`, `uv.lock`, `requirements*.txt`, or existing project scripts)
- Go: use Go modules tooling (`go mod` / existing project scripts)
- Java: follow project tooling (`mvn`/Maven or `gradle`/Gradle wrappers)

Install dependencies only when strictly necessary for the selected integration approach.

## Ambiguity Handling

- If multiple stacks/frameworks look active, ask one focused question.
- If ownership is still unclear, choose the least invasive path and note assumptions.

## Focused Question Examples

- "I found multiple routers. Which one currently owns app routes?"
- "I found backend and frontend apps. Which app should host the widget UI?"
- "I found multiple data-fetching patterns. Which one should new widget code follow?"
- "I found multiple services that could issue widget tokens. Which one should own token generation?"
